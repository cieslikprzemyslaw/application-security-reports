#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const policyPath = path.resolve(
  __dirname,
  '../security/dependency-audit-policy.json',
);

const severityRank = {
  info: 0,
  low: 1,
  moderate: 2,
  medium: 2,
  high: 3,
  critical: 4,
};

function normaliseSeverity(severity) {
  return String(severity || '')
    .trim()
    .toLowerCase();
}

function severityValue(severity) {
  return severityRank[normaliseSeverity(severity)] ?? -1;
}

function readPolicy() {
  if (!existsSync(policyPath)) {
    throw new Error(`Dependency audit policy file not found: ${policyPath}`);
  }

  const policy = JSON.parse(readFileSync(policyPath, 'utf8'));

  if (!Array.isArray(policy.accepted)) {
    throw new Error(
      'dependency-audit-policy.json must contain an accepted array.',
    );
  }

  return policy;
}

function validateAcceptanceEntry(entry, index) {
  const prefix = `accepted[${index}]`;

  if (!entry.package || typeof entry.package !== 'string') {
    throw new Error(`${prefix}.package is required.`);
  }

  if (
    !entry.reason ||
    typeof entry.reason !== 'string' ||
    entry.reason.trim().length < 20
  ) {
    throw new Error(
      `${prefix}.reason is required and should explain the temporary risk acceptance.`,
    );
  }

  if (!entry.expires || typeof entry.expires !== 'string') {
    throw new Error(`${prefix}.expires is required in YYYY-MM-DD format.`);
  }

  const expiry = new Date(`${entry.expires}T00:00:00.000Z`);

  if (Number.isNaN(expiry.getTime())) {
    throw new Error(`${prefix}.expires must be a valid YYYY-MM-DD date.`);
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (expiry < today) {
    throw new Error(
      `${prefix} for package "${entry.package}" has expired on ${entry.expires}.`,
    );
  }

  if (!entry.issue || typeof entry.issue !== 'string') {
    throw new Error(
      `${prefix}.issue is required. Use a GitHub issue URL or TODO if the issue is not created yet.`,
    );
  }
}

function runNpmAudit() {
  const result = spawnSync('npm', ['audit', '--json'], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  const stdout = result.stdout?.trim();
  const stderr = result.stderr?.trim();

  if (!stdout) {
    throw new Error(
      `npm audit did not return JSON output.${stderr ? `\n${stderr}` : ''}`,
    );
  }

  try {
    return JSON.parse(stdout);
  } catch (error) {
    throw new Error(
      `Failed to parse npm audit JSON output: ${error.message}${stderr ? `\n${stderr}` : ''}`,
    );
  }
}

function getAdvisoryIdentifiers(vulnerability) {
  const identifiers = new Set();

  for (const item of vulnerability.via || []) {
    if (typeof item === 'string') {
      identifiers.add(item);
      continue;
    }

    if (!item || typeof item !== 'object') {
      continue;
    }

    for (const key of ['source', 'id', 'name', 'dependency', 'title', 'url']) {
      if (item[key]) {
        identifiers.add(String(item[key]));
      }
    }
  }

  return [...identifiers];
}

function isAccepted(packageName, vulnerability, policy) {
  const identifiers = getAdvisoryIdentifiers(vulnerability);
  const severity = normaliseSeverity(vulnerability.severity);

  return policy.accepted.find(entry => {
    if (entry.package !== packageName) {
      return false;
    }

    if (entry.severity && normaliseSeverity(entry.severity) !== severity) {
      return false;
    }

    const acceptedAdvisoryIds = Array.isArray(entry.advisoryIds)
      ? entry.advisoryIds.map(String)
      : [];

    if (acceptedAdvisoryIds.length > 0) {
      return acceptedAdvisoryIds.some(id => identifiers.includes(id));
    }

    return true;
  });
}

function formatFixAvailable(fixAvailable) {
  if (!fixAvailable) {
    return 'no';
  }

  if (fixAvailable === true) {
    return 'yes';
  }

  if (typeof fixAvailable === 'object') {
    const name = fixAvailable.name ? `${fixAvailable.name}` : 'unknown package';
    const version = fixAvailable.version ? `@${fixAvailable.version}` : '';
    const major = fixAvailable.isSemVerMajor ? ' (semver-major)' : '';
    return `${name}${version}${major}`;
  }

  return String(fixAvailable);
}

try {
  const policy = readPolicy();

  policy.accepted.forEach(validateAcceptanceEntry);

  const minimumSeverity = normaliseSeverity(policy.minimumSeverity || 'high');
  const minimumRank = severityValue(minimumSeverity);

  if (minimumRank < 0) {
    throw new Error(`Unsupported minimumSeverity: ${policy.minimumSeverity}`);
  }

  const audit = runNpmAudit();
  const vulnerabilities = audit.vulnerabilities || {};

  const blocking = [];
  const accepted = [];

  for (const [packageName, vulnerability] of Object.entries(vulnerabilities)) {
    const severity = normaliseSeverity(vulnerability.severity);

    if (severityValue(severity) < minimumRank) {
      continue;
    }

    const acceptance = isAccepted(packageName, vulnerability, policy);
    const finding = {
      packageName,
      severity,
      isDirect: Boolean(vulnerability.isDirect),
      fixAvailable: formatFixAvailable(vulnerability.fixAvailable),
      identifiers: getAdvisoryIdentifiers(vulnerability),
      via: vulnerability.via || [],
    };

    if (acceptance) {
      accepted.push({ ...finding, acceptance });
    } else {
      blocking.push(finding);
    }
  }

  if (accepted.length > 0) {
    console.log('Accepted dependency risks:');
    for (const finding of accepted) {
      console.log(
        `- ${finding.packageName} (${finding.severity}) accepted until ${finding.acceptance.expires}`,
      );
      console.log(`  reason: ${finding.acceptance.reason}`);
      console.log(`  issue: ${finding.acceptance.issue}`);
    }
    console.log('');
  }

  if (blocking.length > 0) {
    console.error('Blocking dependency vulnerabilities found:');
    for (const finding of blocking) {
      console.error(`- ${finding.packageName} (${finding.severity})`);
      console.error(`  direct dependency: ${finding.isDirect ? 'yes' : 'no'}`);
      console.error(`  fix available: ${finding.fixAvailable}`);
      if (finding.identifiers.length > 0) {
        console.error(`  identifiers: ${finding.identifiers.join(', ')}`);
      }
    }

    console.error('');
    console.error(
      'Decision required: fix the dependency or add a documented temporary risk acceptance.',
    );
    process.exit(1);
  }

  console.log(
    `Dependency audit policy passed. No unaccepted ${minimumSeverity}+ vulnerabilities found.`,
  );
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

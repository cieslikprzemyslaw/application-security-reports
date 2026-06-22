#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, statSync, readFileSync } from 'node:fs';

const MAX_LINES = 400;

const ignoredPathPatterns = [
  /(^|\/)(?:package-lock\.json|npm-shrinkwrap\.json|pnpm-lock\.yaml|yarn\.lock)$/,
  /^generated\//,
  /^node_modules\//,
  /^dist\//,
  /^coverage\//,
  /^\.git\//,
  /^prisma\/migrations\//,
];

const checkedExtensions = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.css',
  '.scss',
  '.json',
  '.md',
  '.yml',
  '.yaml',
]);

const runGit = args =>
  execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();

const getExtension = path => {
  const index = path.lastIndexOf('.');
  return index >= 0 ? path.slice(index) : '';
};

const shouldIgnore = path =>
  ignoredPathPatterns.some(pattern => pattern.test(path)) ||
  !checkedExtensions.has(getExtension(path));

const eventName = process.env.GITHUB_EVENT_NAME;
const baseRef = process.env.GITHUB_BASE_REF;

if (eventName !== 'pull_request') {
  console.log(
    'File length check skipped: this check only applies to pull requests.',
  );
  process.exit(0);
}

if (!baseRef) {
  console.error('File length check failed: GITHUB_BASE_REF is not set.');
  process.exit(1);
}

runGit(['fetch', '--no-tags', '--depth=1', 'origin', baseRef]);

const changedFiles = runGit([
  'diff',
  '--name-only',
  '--diff-filter=ACMR',
  `origin/${baseRef}...HEAD`,
])
  .split('\n')
  .map(file => file.trim())
  .filter(Boolean)
  .filter(file => !shouldIgnore(file))
  .filter(file => existsSync(file) && statSync(file).isFile());

const oversizedFiles = changedFiles
  .map(file => {
    const lineCount = readFileSync(file, 'utf8').split(/\r\n|\r|\n/).length;
    return { file, lineCount };
  })
  .filter(({ lineCount }) => lineCount > MAX_LINES)
  .sort((left, right) => right.lineCount - left.lineCount);

if (oversizedFiles.length === 0) {
  console.log(
    `File length check passed. No edited source files exceed ${MAX_LINES} lines.`,
  );
  process.exit(0);
}

console.error(
  `File length check failed. Edited files must stay at or below ${MAX_LINES} lines.`,
);
console.error('');
console.error('Oversized edited files:');

for (const { file, lineCount } of oversizedFiles) {
  console.error(`- ${file}: ${lineCount} lines`);
}

console.error('');
console.error(
  'Split the touched file or explain/adjust the scope before merging.',
);

process.exit(1);

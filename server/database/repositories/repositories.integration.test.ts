import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { RepositoryConstraintError } from '../errors.js';
import { createActivityRepository } from './activity.repository.js';
import { createAssessmentRepository } from './assessment.repository.js';
import { createCompanyRepository } from './company.repository.js';
import { createEvidenceRepository } from './evidence.repository.js';
import { createReportRepository } from './report.repository.js';
import { createSettingsRepository } from './settings.repository.js';
import { createThreatRepository } from './threat.repository.js';

const buildDir = process.env.APPSEC_BUILD_DIR;
const databaseUrl = process.env.DATABASE_URL;

if (!buildDir) {
  throw new Error(
    'APPSEC_BUILD_DIR must be set for repository integration tests.',
  );
}

if (!databaseUrl) {
  throw new Error('DATABASE_URL must be set for repository integration tests.');
}

const databasePath = databaseUrl.startsWith('file:')
  ? `${databaseUrl.slice('file:'.length)}.${process.pid}.${Date.now()}`
  : `${databaseUrl}.${process.pid}.${Date.now()}`;
const migrationPath = path.resolve(
  buildDir,
  '..',
  '..',
  'prisma',
  'migrations',
  '20260612100556_define_domain_model',
  'migration.sql',
);
const migrationSql = readFileSync(migrationPath, 'utf8');
const schemaSql = migrationSql.slice(migrationSql.indexOf('-- CreateTable'));
const threatMigrationPath = path.resolve(
  buildDir,
  '..',
  '..',
  'prisma',
  'migrations',
  '20260616120000_add_finding_category_fields',
  'migration.sql',
);
const threatMigrationSql = readFileSync(threatMigrationPath, 'utf8');
const adapterUrl = databaseUrl.startsWith('file:')
  ? `file:${databasePath}`
  : databasePath;
const require = createRequire(import.meta.url);
const Database = require('better-sqlite3') as new (databasePath: string) => {
  pragma(sql: string): void;
  exec(sql: string): void;
  close(): void;
};

{
  const bootstrapDb = new Database(databasePath);
  try {
    bootstrapDb.exec(schemaSql);
    bootstrapDb.exec(threatMigrationSql);
  } finally {
    bootstrapDb.close();
  }
}

const { PrismaClient } = await import(
  pathToFileURL(path.join(buildDir, 'generated', 'prisma', 'client.js')).href
);

const adapter = new PrismaBetterSqlite3({ url: adapterUrl });
const prisma = new PrismaClient({ adapter });

try {
  // Test-only SQLite configuration.
  // These static PRAGMA statements are required on the Prisma connection
  // to prevent journal-file failures in the temporary test environment.
  // No user-controlled input is included.
  await prisma.$executeRawUnsafe('PRAGMA journal_mode = MEMORY');
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');

  const companyRepo = createCompanyRepository(prisma);
  const assessmentRepo = createAssessmentRepository(prisma);
  const threatRepo = createThreatRepository(prisma);
  const evidenceRepo = createEvidenceRepository(prisma);
  const reportRepo = createReportRepository(prisma);
  const activityRepo = createActivityRepository(prisma);
  const settingsRepo = createSettingsRepository(prisma);

  const company = await companyRepo.create({
    name: 'Northstar Digital',
    description: 'Security consulting',
    website: 'https://northstar.example',
    contactName: 'Ada Lovelace',
    contactEmail: 'ada@example.com',
    logoPath: undefined,
    footerText: undefined,
  });

  assert.ok(company.id.startsWith('cmp_'));
  assert.equal((await companyRepo.findById(company.id))?.id, company.id);

  const assessment = await assessmentRepo.create({
    companyId: company.id,
    title: 'API review',
    description: 'Main review',
    scope: 'Backend API',
    status: 'draft',
    startedAt: '2026-06-01',
    completedAt: undefined,
    applicationName: 'AppSec Report Builder',
    environment: 'local',
    assessmentType: 'web',
    overallRisk: 'medium',
  });

  const threat = await threatRepo.create({
    assessmentId: assessment.id,
    title: 'Injection risk',
    description: 'Test threat',
    severity: 'high',
    strideCategories: ['tampering', 'spoofing'],
    status: 'open',
    affectedAsset: 'API',
    impact: undefined,
    recommendation: 'Use parameterized queries',
    observation: undefined,
    affectedComponent: undefined,
    affectedEndpoint: undefined,
    risk: undefined,
  });

  const evidence = await evidenceRepo.create({
    assessmentId: assessment.id,
    threatIds: [threat.id],
    type: 'note',
    title: 'Request log',
    description: 'Captured evidence',
    content: 'payload',
    fileName: undefined,
    filePath: undefined,
    mimeType: undefined,
    capturedAt: '2026-06-02',
  });

  const report = await reportRepo.create({
    assessmentId: assessment.id,
    title: 'Final report',
    status: 'draft',
    latestVersion: 1,
    executiveSummary: 'Summary',
    selectedThreatIds: [],
  });

  const activity = await activityRepo.create({
    entityType: 'assessment',
    entityId: assessment.id,
    action: 'created',
    message: 'Assessment created',
  });

  const settings = await settingsRepo.upsert({
    organisationName: 'Northstar Digital',
    consultantName: 'Ada Lovelace',
    consultantEmail: 'ada@example.com',
    defaultReportTitle: 'Security report',
    defaultSeverity: 'medium',
    theme: 'system',
    dateFormat: 'YYYY-MM-DD',
    reportFooterText: 'Confidential',
    methodology: 'OWASP',
    reportStyle: 'Narrative',
    includeEvidence: true,
    confidentialReports: false,
  });

  assert.ok(evidence.threatIds.includes(threat.id));
  assert.ok(activity.id.startsWith('act_'));
  assert.equal((await settingsRepo.get())?.id, settings.id);

  const loadedThreats = await threatRepo.findByAssessmentId(assessment.id);
  assert.equal(loadedThreats.length, 1);

  const loadedEvidence = await evidenceRepo.findById(evidence.id);
  assert.ok(loadedEvidence);
  assert.deepEqual(loadedEvidence?.threatIds, [threat.id]);

  await reportRepo.attachThreat(report.id, threat.id);
  const loadedReportAfterAttach = await reportRepo.findById(report.id);
  assert.ok(loadedReportAfterAttach);
  assert.deepEqual(loadedReportAfterAttach?.selectedThreatIds, [threat.id]);

  await reportRepo.detachThreat(report.id, threat.id);
  const loadedReportAfterDetach = await reportRepo.findById(report.id);
  assert.ok(loadedReportAfterDetach);
  assert.deepEqual(loadedReportAfterDetach?.selectedThreatIds, []);

  await assert.rejects(
    companyRepo.delete(company.id),
    error => error instanceof RepositoryConstraintError,
  );
} finally {
  await prisma.$disconnect();
}

console.log('repository integration checks passed');

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { ValidationError } from '../../../src/validation/index.js';
import { buildReportPreviewSnapshotFixture } from '../../test/report-preview.fixture.js';
import { RepositoryConflictError } from '../errors.js';
import { createAssessmentRepository } from './assessment.repository.js';
import { createCompanyRepository } from './company.repository.js';
import { createReportRepository } from './report.repository.js';
import { createReportVersionRepository } from './reportVersion.repository.js';

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
  ? `${databaseUrl.slice('file:'.length)}.rv.${process.pid}.${Date.now()}`
  : `${databaseUrl}.rv.${process.pid}.${Date.now()}`;

const loadSql = (...segments: string[]) =>
  readFileSync(path.resolve(buildDir, '..', '..', ...segments), 'utf8');

const migrationSql = loadSql(
  'prisma',
  'migrations',
  '20260612100556_define_domain_model',
  'migration.sql',
);
const schemaSql = migrationSql.slice(migrationSql.indexOf('-- CreateTable'));
const assessmentMigrationSql = loadSql(
  'prisma',
  'migrations',
  '20260619120000_add_owasp_taxonomy_version_to_assessment',
  'migration.sql',
);
const companyLogoMigrationSql = loadSql(
  'prisma',
  'migrations',
  '20260620090747',
  'migration.sql',
);
const settingsBrandingMigrationSql = loadSql(
  'prisma',
  'migrations',
  '20260617120000_extend_settings_branding',
  'migration.sql',
);
const threatMigrationSql = loadSql(
  'prisma',
  'migrations',
  '20260616120000_add_finding_category_fields',
  'migration.sql',
);
const evidenceMigrationSql = loadSql(
  'prisma',
  'migrations',
  '20260616190000_add_structured_evidence',
  'migration.sql',
);
const reportVersionMigrationSql = loadSql(
  'prisma',
  'migrations',
  '20260621120000_add_report_version',
  'migration.sql',
);
const companyArchivedAtMigrationSql = loadSql(
  'prisma',
  'migrations',
  '20260621130000_add_company_archived_at',
  'migration.sql',
);
const reportVersionUniquenessMigrationSql = loadSql(
  'prisma',
  'migrations',
  '20260624101500_add_report_version_number_uniqueness',
  'migration.sql',
);
const reportThreatPositionMigrationSql = loadSql(
  'prisma',
  'migrations',
  '20260625193000_add_report_threat_position',
  'migration.sql',
);

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
    bootstrapDb.exec(companyLogoMigrationSql);
    bootstrapDb.exec(assessmentMigrationSql);
    bootstrapDb.exec(settingsBrandingMigrationSql);
    bootstrapDb.exec(threatMigrationSql);
    bootstrapDb.exec(evidenceMigrationSql);
    bootstrapDb.exec(reportVersionMigrationSql);
    bootstrapDb.exec(reportVersionUniquenessMigrationSql);
    bootstrapDb.exec(companyArchivedAtMigrationSql);
    bootstrapDb.exec(reportThreatPositionMigrationSql);
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
  await prisma.$executeRawUnsafe('PRAGMA journal_mode = MEMORY');
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');

  const companyRepo = createCompanyRepository(prisma);
  const assessmentRepo = createAssessmentRepository(prisma);
  const reportRepo = createReportRepository(prisma);
  const reportVersionRepo = createReportVersionRepository(prisma);

  const company = await companyRepo.create({
    name: 'Northstar Digital',
    description: 'Security consulting',
    website: 'https://northstar.example',
    contactName: 'Ada Lovelace',
    contactEmail: 'ada@example.com',
    footerText: undefined,
  });

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

  const report = await reportRepo.create({
    assessmentId: assessment.id,
    title: 'Final report',
    status: 'draft',
    latestVersion: 1,
    executiveSummary: 'Summary',
    selectedThreatIds: [],
  });

  const validSnapshot = buildReportPreviewSnapshotFixture();

  const draftVersion = await reportVersionRepo.create({
    reportId: report.id,
    version: 1,
    status: 'draft',
    generatedAt: '2026-06-21',
    filePath: undefined,
    snapshot: validSnapshot,
  });

  assert.ok(draftVersion.id.startsWith('rvs_'));
  assert.equal(draftVersion.reportId, report.id);
  assert.equal(draftVersion.version, 1);
  assert.equal(draftVersion.status, 'draft');
  assert.equal(draftVersion.generatedAt, '2026-06-21');
  assert.equal(draftVersion.filePath, undefined);
  assert.deepEqual(draftVersion.snapshot, validSnapshot);

  const finalVersion = await reportVersionRepo.create({
    reportId: report.id,
    version: 10,
    status: 'final',
    generatedAt: '2026-06-21',
    filePath: undefined,
    snapshot: validSnapshot,
  });

  assert.equal(finalVersion.status, 'final');
  assert.equal(finalVersion.version, 10);

  await assert.rejects(
    reportVersionRepo.create({
      reportId: report.id,
      version: 10,
      status: 'final',
      generatedAt: '2026-06-21',
      filePath: undefined,
      snapshot: validSnapshot,
    }),
    error => error instanceof RepositoryConflictError,
  );

  const loadedDraft = await reportVersionRepo.findById(draftVersion.id);
  assert.ok(loadedDraft);
  assert.equal(loadedDraft?.id, draftVersion.id);
  assert.equal(loadedDraft?.status, 'draft');
  assert.deepEqual(loadedDraft?.snapshot, validSnapshot);

  assert.equal(
    await reportVersionRepo.findById(
      'rvs_00000000-0000-0000-0000-000000000099',
    ),
    null,
  );

  const versionList = await reportVersionRepo.findByReportId(report.id);
  assert.equal(versionList.length, 2);
  assert.ok(versionList.every(v => v.reportId === report.id));

  await reportVersionRepo.applyRetention(report.id, finalVersion.version);
  const retainedVersions = await reportVersionRepo.findByReportId(report.id);
  assert.deepEqual(
    retainedVersions.map(version => [version.version, version.status]),
    [[10, 'final']],
  );

  await assert.rejects(
    reportVersionRepo.create({
      reportId: report.id,
      version: 3,
      status: 'draft',
      generatedAt: '2026-06-21',
      filePath: undefined,
      snapshot: { reportTitle: 'Missing required fields' } as never,
    }),
    error => error instanceof ValidationError,
  );
} finally {
  await prisma.$disconnect();
}

console.log('report version repository integration checks passed');

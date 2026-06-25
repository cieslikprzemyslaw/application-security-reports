import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

import { loadServerConfig } from '../../config.js';
import { createAssessmentRepository } from '../../database/repositories/assessment.repository.js';
import { createCompanyRepository } from '../../database/repositories/company.repository.js';
import { createEvidenceRepository } from '../../database/repositories/evidence.repository.js';
import { createReportRepository } from '../../database/repositories/report.repository.js';
import { createReportVersionRepository } from '../../database/repositories/reportVersion.repository.js';
import { createSettingsRepository } from '../../database/repositories/settings.repository.js';
import { createThreatRepository } from '../../database/repositories/threat.repository.js';
import { createApiApp } from '../api-app.js';
import type { PrismaClient as PrismaClientType } from '../../../generated/prisma/client.js';
import { seedReportsData, type ReportsSeedData } from './fixtures.js';

const repoRoot = path.resolve(process.cwd());
const migrationPath = path.resolve(
  repoRoot,
  'prisma',
  'migrations',
  '20260612100556_define_domain_model',
  'migration.sql',
);
const migrationSql = readFileSync(migrationPath, 'utf8');
const schemaSql = migrationSql.slice(migrationSql.indexOf('-- CreateTable'));
const assessmentMigrationPath = path.resolve(
  repoRoot,
  'prisma',
  'migrations',
  '20260619120000_add_owasp_taxonomy_version_to_assessment',
  'migration.sql',
);
const assessmentMigrationSql = readFileSync(assessmentMigrationPath, 'utf8');
const settingsBrandingMigrationPath = path.resolve(
  repoRoot,
  'prisma',
  'migrations',
  '20260617120000_extend_settings_branding',
  'migration.sql',
);
const settingsBrandingMigrationSql = readFileSync(
  settingsBrandingMigrationPath,
  'utf8',
);
const threatMigrationPath = path.resolve(
  repoRoot,
  'prisma',
  'migrations',
  '20260616120000_add_finding_category_fields',
  'migration.sql',
);
const threatMigrationSql = readFileSync(threatMigrationPath, 'utf8');
const evidenceMigrationPath = path.resolve(
  repoRoot,
  'prisma',
  'migrations',
  '20260616190000_add_structured_evidence',
  'migration.sql',
);
const evidenceMigrationSql = readFileSync(evidenceMigrationPath, 'utf8');
const companyLogoMigrationPath = path.resolve(
  repoRoot,
  'prisma',
  'migrations',
  '20260620090747',
  'migration.sql',
);
const companyLogoMigrationSql = readFileSync(companyLogoMigrationPath, 'utf8');
const reportVersionMigrationPath = path.resolve(
  repoRoot,
  'prisma',
  'migrations',
  '20260621120000_add_report_version',
  'migration.sql',
);
const reportVersionMigrationSql = readFileSync(
  reportVersionMigrationPath,
  'utf8',
);
const companyArchivedAtMigrationPath = path.resolve(
  repoRoot,
  'prisma',
  'migrations',
  '20260621130000_add_company_archived_at',
  'migration.sql',
);
const companyArchivedAtMigrationSql = readFileSync(
  companyArchivedAtMigrationPath,
  'utf8',
);
const reportVersionUniquenessMigrationPath = path.resolve(
  repoRoot,
  'prisma',
  'migrations',
  '20260624101500_add_report_version_number_uniqueness',
  'migration.sql',
);
const reportVersionUniquenessMigrationSql = readFileSync(
  reportVersionUniquenessMigrationPath,
  'utf8',
);
const reportThreatPositionMigrationPath = path.resolve(
  repoRoot,
  'prisma',
  'migrations',
  '20260625193000_add_report_threat_position',
  'migration.sql',
);
const reportThreatPositionMigrationSql = readFileSync(
  reportThreatPositionMigrationPath,
  'utf8',
);
const allowedOrigin = 'http://localhost:5173';
const config = loadServerConfig({
  FRONTEND_ORIGIN: allowedOrigin,
});

const nodeRequire = createRequire(import.meta.url);
const Database = nodeRequire('better-sqlite3') as new (
  databasePath: string,
) => {
  exec(sql: string): void;
  close(): void;
  pragma(sql: string): void;
};

const prismaClientPath = pathToFileURL(
  path.join(repoRoot, 'generated', 'prisma', 'client.js'),
).href;
const { PrismaClient } = await import(prismaClientPath);

export const startTestServer = async (app: ReturnType<typeof createApiApp>) => {
  const server = createServer(app);

  await new Promise<void>(resolve => {
    server.listen(0, resolve);
  });

  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Expected the test server to listen on an ephemeral port.');
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: async () =>
      new Promise<void>((resolve, reject) => {
        server.close(error => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      }),
  };
};

export type ReportsRouteIntegrationHarness = ReportsSeedData & {
  prisma: PrismaClientType;
  companyRepository: ReturnType<typeof createCompanyRepository>;
  assessmentRepository: ReturnType<typeof createAssessmentRepository>;
  threatRepository: ReturnType<typeof createThreatRepository>;
  evidenceRepository: ReturnType<typeof createEvidenceRepository>;
  reportRepository: ReturnType<typeof createReportRepository>;
  reportVersionRepository: ReturnType<typeof createReportVersionRepository>;
  settingsRepository: ReturnType<typeof createSettingsRepository>;
  cleanup: () => Promise<void>;
};

export const createReportsApp = (
  reportRepository: ReturnType<typeof createReportRepository>,
  assessmentRepository: ReturnType<typeof createAssessmentRepository>,
  companyRepository: ReturnType<typeof createCompanyRepository>,
  threatRepository: ReturnType<typeof createThreatRepository>,
  evidenceRepository: ReturnType<typeof createEvidenceRepository>,
  settingsRepository: ReturnType<typeof createSettingsRepository>,
  reportVersionRepository?: ReturnType<typeof createReportVersionRepository>,
) =>
  createApiApp(config, {
    reportRepository,
    assessmentRepository,
    companyRepository,
    threatRepository,
    evidenceRepository,
    settingsRepository,
    reportVersionRepository,
  });

export const createReportsRouteIntegrationHarness =
  async (): Promise<ReportsRouteIntegrationHarness> => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'appsec-reports-'));
    const databasePath = path.join(tempDir, 'reports.sqlite');
    const adapterUrl = `file:${databasePath.replaceAll('\\', '/')}`;
    const bootstrapDb = new Database(databasePath);

    try {
      bootstrapDb.exec(schemaSql);
      bootstrapDb.exec(companyLogoMigrationSql);
      bootstrapDb.exec(companyArchivedAtMigrationSql);
      bootstrapDb.exec(assessmentMigrationSql);
      bootstrapDb.exec(settingsBrandingMigrationSql);
      bootstrapDb.exec(threatMigrationSql);
      bootstrapDb.exec(evidenceMigrationSql);
      bootstrapDb.exec(reportVersionMigrationSql);
      bootstrapDb.exec(reportVersionUniquenessMigrationSql);
      bootstrapDb.exec(reportThreatPositionMigrationSql);
    } finally {
      bootstrapDb.close();
    }

    const prisma = new PrismaClient({
      adapter: new PrismaBetterSqlite3({ url: adapterUrl }),
    });

    try {
      await prisma.$executeRawUnsafe('PRAGMA journal_mode = MEMORY');
      await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');

      const companyRepository = createCompanyRepository(prisma);
      const assessmentRepository = createAssessmentRepository(prisma);
      const threatRepository = createThreatRepository(prisma);
      const evidenceRepository = createEvidenceRepository(prisma);
      const reportRepository = createReportRepository(prisma);
      const reportVersionRepository = createReportVersionRepository(prisma);
      const settingsRepository = createSettingsRepository(prisma);

      const seeded = await seedReportsData(prisma, settingsRepository);

      return {
        prisma,
        companyRepository,
        assessmentRepository,
        threatRepository,
        evidenceRepository,
        reportRepository,
        reportVersionRepository,
        settingsRepository,
        ...seeded,
        cleanup: async () => {
          await prisma.$disconnect();
          await rm(tempDir, { recursive: true, force: true });
        },
      };
    } catch (error) {
      await prisma.$disconnect();
      await rm(tempDir, { recursive: true, force: true });
      throw error;
    }
  };

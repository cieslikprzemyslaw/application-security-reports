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
import { createThreatRepository } from '../../database/repositories/threat.repository.js';
import { createApiApp } from '../api-app.js';
import type { PrismaClient as PrismaClientType } from '../../../generated/prisma/client.js';

const repoRoot = path.resolve(process.cwd());
const readMigration = (name: string) =>
  readFileSync(
    path.resolve(repoRoot, 'prisma', 'migrations', name, 'migration.sql'),
    'utf8',
  );

const migrationSql = readMigration('20260612100556_define_domain_model');
const schemaSql = migrationSql.slice(migrationSql.indexOf('-- CreateTable'));
const companyLogoMigrationSql = readMigration('20260620090747');
const companyArchivedAtMigrationSql = readMigration(
  '20260621130000_add_company_archived_at',
);
const assessmentMigrationSql = readMigration(
  '20260619120000_add_owasp_taxonomy_version_to_assessment',
);
const threatMigrationSql = readMigration(
  '20260616120000_add_finding_category_fields',
);
const evidenceMigrationSql = readMigration(
  '20260616190000_add_structured_evidence',
);
const reportVersionMigrationSql = readMigration(
  '20260621120000_add_report_version',
);
const reportThreatPositionMigrationSql = readMigration(
  '20260625193000_add_report_threat_position',
);
const cweCatalogMigrationSql = readMigration(
  '20260725000100_add_cwe_catalog_version_to_assessment',
);
const threatCweMigrationSql = readMigration(
  '20260725000200_add_threat_cwe_mappings',
);
const lifecycleMigrationSql = readMigration(
  '20260725000300_add_assessment_lifecycle_and_activity_vocabulary',
);
const allowedOrigin = 'http://localhost:5173';
const config = loadServerConfig({ FRONTEND_ORIGIN: allowedOrigin });

const nodeRequire = createRequire(import.meta.url);
const Database = nodeRequire('better-sqlite3') as new (
  databasePath: string,
) => {
  exec(sql: string): void;
  close(): void;
  pragma(sql: string): void;
};

const startTestServer = async (app: ReturnType<typeof createApiApp>) => {
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

const prismaClientPath = pathToFileURL(
  path.join(repoRoot, 'generated', 'prisma', 'client.js'),
).href;
const { PrismaClient } = await import(prismaClientPath);

export type AssessmentsRouteIntegrationHarness = {
  server: Awaited<ReturnType<typeof startTestServer>>;
  prisma: PrismaClientType;
  company: {
    id: string;
    name: string;
  };
  assessment: {
    id: string;
    updatedAt: string;
    recordVersion: number;
  };
  assessmentRepository: ReturnType<typeof createAssessmentRepository>;
  cleanup: () => Promise<void>;
};

export const createAssessmentsRouteIntegrationHarness =
  async (): Promise<AssessmentsRouteIntegrationHarness> => {
    const tempDir = await mkdtemp(
      path.join(os.tmpdir(), 'appsec-assessments-'),
    );
    const databasePath = path.join(tempDir, 'assessments.sqlite');
    const adapterUrl = `file:${databasePath.replaceAll('\\', '/')}`;
    const bootstrapDb = new Database(databasePath);

    try {
      bootstrapDb.exec(schemaSql);
      bootstrapDb.exec(companyLogoMigrationSql);
      bootstrapDb.exec(companyArchivedAtMigrationSql);
      bootstrapDb.exec(assessmentMigrationSql);
      bootstrapDb.exec(threatMigrationSql);
      bootstrapDb.exec(evidenceMigrationSql);
      bootstrapDb.exec(reportVersionMigrationSql);
      bootstrapDb.exec(reportThreatPositionMigrationSql);
      bootstrapDb.exec(cweCatalogMigrationSql);
      bootstrapDb.exec(threatCweMigrationSql);
      bootstrapDb.exec(lifecycleMigrationSql);
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

      const server = await startTestServer(
        createApiApp(config, {
          assessmentRepository,
          companyRepository,
          threatRepository,
          evidenceRepository,
          reportRepository,
        }),
      );

      const company = await companyRepository.create({
        name: 'Northstar Digital',
        description: 'Security consulting and managed assessment services',
        website: 'https://northstar.example',
        contactName: 'Alex Mercer',
        contactEmail: 'security@northstar.example',
        footerText: 'Confidential - do not distribute.',
      });

      const assessment = await assessmentRepository.create({
        companyId: company.id,
        title: 'Customer Services Portal',
        description: 'Assessment of the customer portal',
        scope: 'Web application',
        status: 'in-progress',
        startedAt: '2026-06-01',
        applicationName: 'Customer Services Portal',
        environment: 'Production',
        assessmentType: 'Web App',
        overallRisk: 'high',
      });

      return {
        server,
        prisma,
        company: {
          id: company.id,
          name: company.name,
        },
        assessment: {
          id: assessment.id,
          updatedAt: assessment.updatedAt,
          recordVersion: assessment.recordVersion,
        },
        assessmentRepository,
        cleanup: async () => {
          await server.close();
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

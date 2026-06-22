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
        completedAt: '2026-06-10',
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

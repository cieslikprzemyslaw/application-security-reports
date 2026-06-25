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
import {
  OWASP_TOP_10_CURRENT_VERSION,
  OWASP_TOP_10_REGISTRY,
} from '../../../src/domain/index.js';
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

const owaspTop10Categories =
  OWASP_TOP_10_REGISTRY[OWASP_TOP_10_CURRENT_VERSION].categories;

const prismaClientPath = pathToFileURL(
  path.join(repoRoot, 'generated', 'prisma', 'client.js'),
).href;
const { PrismaClient } = await import(prismaClientPath);

export type ThreatsRouteIntegrationHarness = {
  server: Awaited<ReturnType<typeof startTestServer>>;
  prisma: PrismaClientType;
  assessmentRepository: ReturnType<typeof createAssessmentRepository>;
  threatRepository: ReturnType<typeof createThreatRepository>;
  evidenceRepository: ReturnType<typeof createEvidenceRepository>;
  reportRepository: ReturnType<typeof createReportRepository>;
  primaryAssessment: {
    id: string;
  };
  secondaryAssessment: {
    id: string;
  };
  secondaryThreat: {
    id: string;
  };
  cleanup: () => Promise<void>;
};

export const createThreatsRouteIntegrationHarness =
  async (): Promise<ThreatsRouteIntegrationHarness> => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'appsec-threats-'));
    const databasePath = path.join(tempDir, 'threats.sqlite');
    const adapterUrl = `file:${databasePath.replaceAll('\\', '/')}`;
    const bootstrapDb = new Database(databasePath);

    try {
      bootstrapDb.exec(schemaSql);
      bootstrapDb.exec(companyLogoMigrationSql);
      bootstrapDb.exec(companyArchivedAtMigrationSql);
      bootstrapDb.exec(assessmentMigrationSql);
      bootstrapDb.exec(threatMigrationSql);
      bootstrapDb.exec(evidenceMigrationSql);
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
      const server = await startTestServer(
        createApiApp(config, {
          assessmentRepository,
          threatRepository,
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

      const primaryAssessment = await assessmentRepository.create({
        companyId: company.id,
        title: 'Primary assessment',
        description: 'Threat API coverage',
        scope: 'API surface',
        status: 'in-progress',
        startedAt: '2026-06-01',
        completedAt: undefined,
        applicationName: 'AppSec Report Builder',
        environment: 'local',
        assessmentType: 'web',
        overallRisk: 'high',
      });

      const secondaryAssessment = await assessmentRepository.create({
        companyId: company.id,
        title: 'Secondary assessment',
        description: 'Other threat set',
        scope: 'Other API surface',
        status: 'draft',
        startedAt: '2026-06-02',
        completedAt: undefined,
        applicationName: 'AppSec Report Builder',
        environment: 'local',
        assessmentType: 'web',
        overallRisk: 'medium',
      });

      await threatRepository.create({
        assessmentId: primaryAssessment.id,
        title: 'Missing Server-Side Authorization',
        description: 'The endpoint returns another customer order.',
        severity: 'critical',
        strideCategories: ['spoofing', 'tampering'],
        status: 'accepted-risk',
        owaspCategoryCode: owaspTop10Categories.A09.value,
        affectedAsset: '/api/v1/orders/{id}',
        impact: 'Unauthorised access to customer order data',
        recommendation: 'Apply object-level authorization on every request.',
        observation: 'An authenticated user can access another customer order.',
        affectedComponent: 'Orders API',
        affectedEndpoint: '/api/v1/orders/{id}',
        risk: 'Sensitive order data is exposed.',
        remediation: 'Apply object-level authorization on every request.',
        references: 'OWASP API1:2023, CWE-639',
      });

      const secondaryThreat = await threatRepository.create({
        assessmentId: secondaryAssessment.id,
        title: 'Broken access control',
        description: 'Another threat stored on a different assessment.',
        severity: 'high',
        strideCategories: ['spoofing'],
        status: 'open',
        owaspCategoryCode: 'custom',
        customCategory: 'Information exposure',
        affectedAsset: undefined,
        impact: undefined,
        recommendation: 'Review access checks for object lookups.',
        remediation: 'Review access checks for object lookups.',
        observation: 'The same identifier returns another customer record.',
        reproductionSteps:
          'Request another customer record while authenticated as a basic user.',
        affectedComponent: undefined,
        affectedEndpoint: undefined,
        risk: 'Customer data is exposed.',
        references: 'OWASP API1:2023',
      });

      return {
        server,
        prisma,
        assessmentRepository,
        threatRepository,
        evidenceRepository,
        reportRepository,
        primaryAssessment: {
          id: primaryAssessment.id,
        },
        secondaryAssessment: {
          id: secondaryAssessment.id,
        },
        secondaryThreat: {
          id: secondaryThreat.id,
        },
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

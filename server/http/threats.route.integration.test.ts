import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

import { loadServerConfig } from '../config.js';
import { RepositoryConstraintError } from '../database/errors.js';
import { createAssessmentRepository } from '../database/repositories/assessment.repository.js';
import { createCompanyRepository } from '../database/repositories/company.repository.js';
import { createEvidenceRepository } from '../database/repositories/evidence.repository.js';
import { createReportRepository } from '../database/repositories/report.repository.js';
import { createThreatRepository } from '../database/repositories/threat.repository.js';
import { createApiApp } from './api-app.js';
import {
  OWASP_TOP_10_CURRENT_VERSION,
  OWASP_TOP_10_REGISTRY,
} from '../../src/domain/index.js';

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

const tempDir = await mkdtemp(path.join(os.tmpdir(), 'appsec-threats-'));
const databasePath = path.join(tempDir, 'threats.sqlite');
const adapterUrl = `file:${databasePath.replaceAll('\\', '/')}`;
const prismaClientPath = pathToFileURL(
  path.join(repoRoot, 'generated', 'prisma', 'client.js'),
).href;
const { PrismaClient } = await import(prismaClientPath);

const bootstrapDb = new Database(databasePath);

try {
  bootstrapDb.exec(schemaSql);
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
      threatRepository,
    }),
  );

  try {
    const company = await companyRepository.create({
      name: 'Northstar Digital',
      description: 'Security consulting and managed assessment services',
      website: 'https://northstar.example',
      contactName: 'Alex Mercer',
      contactEmail: 'security@northstar.example',
      logoPath: '/logos/northstar.svg',
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

    const createResponse = await fetch(`${server.baseUrl}/api/threats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
        remediation: 'Apply object-level authorization on every request.',
        observation: 'An authenticated user can access another customer order.',
        reproductionSteps:
          'Request another customer order while authenticated as a low-privilege user.',
        affectedComponent: 'Orders API',
        affectedEndpoint: '/api/v1/orders/{id}',
        risk: 'Sensitive order data is exposed.',
        references: 'OWASP API1:2023, CWE-639',
      }),
    });

    assert.equal(createResponse.status, 201);
    assert.equal(
      createResponse.headers.get('location')?.startsWith('/api/threats/thr_'),
      true,
    );
    const createdJson = (await createResponse.json()) as {
      data: {
        id: string;
        assessmentId: string;
        severity: string;
        owaspCategoryCode?: string;
        customCategory?: string;
      };
    };
    assert.equal(createdJson.data.id.startsWith('thr_'), true);
    assert.equal(createdJson.data.assessmentId, primaryAssessment.id);
    assert.equal(createdJson.data.severity, 'critical');
    assert.equal(createdJson.data.owaspCategoryCode, 'A09:2025');
    assert.equal(createdJson.data.customCategory, undefined);

    const primaryThreatId = createdJson.data.id;

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

    const customGetResponse = await fetch(
      `${server.baseUrl}/api/threats/${secondaryThreat.id}`,
    );
    assert.equal(customGetResponse.status, 200);
    const customGetJson = (await customGetResponse.json()) as {
      data: {
        id: string;
        owaspCategoryCode?: string;
        customCategory?: string;
      };
    };
    assert.equal(customGetJson.data.id, secondaryThreat.id);
    assert.equal(customGetJson.data.owaspCategoryCode, 'custom');
    assert.equal(customGetJson.data.customCategory, 'Information exposure');

    const listResponse = await fetch(
      `${server.baseUrl}/api/threats?assessmentId=${primaryAssessment.id}`,
    );
    assert.equal(listResponse.status, 200);
    const listJson = (await listResponse.json()) as {
      data: Array<{ id: string; owaspCategoryCode?: string }>;
    };
    assert.equal(listJson.data.length, 1);
    assert.equal(listJson.data[0]?.id, primaryThreatId);
    assert.equal(listJson.data[0]?.owaspCategoryCode, 'A09:2025');

    const getResponse = await fetch(
      `${server.baseUrl}/api/threats/${primaryThreatId}`,
    );
    assert.equal(getResponse.status, 200);
    const getJson = (await getResponse.json()) as {
      data: {
        id: string;
        assessmentId: string;
        title: string;
        owaspCategoryCode?: string;
      };
    };
    assert.equal(getJson.data.id, primaryThreatId);
    assert.equal(getJson.data.assessmentId, primaryAssessment.id);
    assert.equal(getJson.data.owaspCategoryCode, 'A09:2025');

    const patchResponse = await fetch(
      `${server.baseUrl}/api/threats/${primaryThreatId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Missing server-side authorization',
          status: 'mitigated',
          risk: 'Risk reduced after remediation',
        }),
      },
    );
    assert.equal(patchResponse.status, 200);
    const patchJson = (await patchResponse.json()) as {
      data: {
        id: string;
        title: string;
        status: string;
        risk?: string;
        owaspCategoryCode?: string;
      };
    };
    assert.equal(patchJson.data.id, primaryThreatId);
    assert.equal(patchJson.data.title, 'Missing server-side authorization');
    assert.equal(patchJson.data.status, 'mitigated');
    assert.equal(patchJson.data.risk, 'Risk reduced after remediation');
    assert.equal(patchJson.data.owaspCategoryCode, 'A09:2025');

    const deleteSecondaryResponse = await fetch(
      `${server.baseUrl}/api/threats/${secondaryThreat.id}`,
      {
        method: 'DELETE',
      },
    );
    assert.equal(deleteSecondaryResponse.status, 204);
    assert.equal(await deleteSecondaryResponse.text(), '');

    await assert.rejects(
      threatRepository.create({
        assessmentId: 'asm_00000000-0000-0000-0000-000000000099',
        title: 'Broken foreign key',
        description: 'Should fail because the assessment does not exist.',
        severity: 'high',
        strideCategories: ['spoofing'],
        status: 'open',
        affectedAsset: undefined,
        impact: undefined,
        recommendation: undefined,
        observation: undefined,
        affectedComponent: undefined,
        affectedEndpoint: undefined,
        risk: undefined,
      }),
      error => error instanceof RepositoryConstraintError,
    );

    const evidence = await evidenceRepository.create({
      assessmentId: primaryAssessment.id,
      threatIds: [primaryThreatId],
      type: 'note',
      title: 'Threat evidence',
      description: 'Evidence linked to the threat',
      content: 'payload',
      fileName: undefined,
      filePath: undefined,
      mimeType: undefined,
      capturedAt: '2026-06-02',
    });

    const report = await reportRepository.create({
      assessmentId: primaryAssessment.id,
      title: 'Threat report',
      status: 'draft',
      latestVersion: 1,
      executiveSummary: 'Summary',
      selectedThreatIds: [primaryThreatId],
    });

    assert.deepEqual(evidence.threatIds, [primaryThreatId]);
    assert.deepEqual(report.selectedThreatIds, [primaryThreatId]);

    const deleteConflictResponse = await fetch(
      `${server.baseUrl}/api/threats/${primaryThreatId}`,
      {
        method: 'DELETE',
      },
    );
    assert.equal(deleteConflictResponse.status, 409);
    const deleteConflictJson = (await deleteConflictResponse.json()) as {
      error: { code: string; message: string; details: [] };
    };
    assert.deepEqual(deleteConflictJson, {
      error: {
        code: 'THREAT_DELETE_CONFLICT',
        message:
          'Threat cannot be deleted while related evidence or reports exist',
        details: [],
      },
    });

    const missingAssessmentResponse = await fetch(
      `${server.baseUrl}/api/threats`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentId: 'asm_00000000-0000-0000-0000-000000000098',
          title: 'Missing assessment threat',
          description: 'Should be blocked before create.',
          severity: 'high',
          strideCategories: ['spoofing'],
          status: 'open',
        }),
      },
    );
    assert.equal(missingAssessmentResponse.status, 404);
    const missingAssessmentJson = (await missingAssessmentResponse.json()) as {
      error: { code: string; message: string; details: [] };
    };
    assert.deepEqual(missingAssessmentJson, {
      error: {
        code: 'ASSESSMENT_NOT_FOUND',
        message: 'Assessment not found',
        details: [],
      },
    });
  } finally {
    await server.close();
  }
} finally {
  await prisma.$disconnect();
  await rm(tempDir, { recursive: true, force: true });
}

console.log('threats API integration checks passed');

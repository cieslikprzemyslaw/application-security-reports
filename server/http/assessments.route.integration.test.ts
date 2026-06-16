import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import { createServer } from 'node:http';

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

import { loadServerConfig } from '../config.js';
import { createAssessmentRepository } from '../database/repositories/assessment.repository.js';
import { createCompanyRepository } from '../database/repositories/company.repository.js';
import { createApiApp } from './api-app.js';

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
const threatMigrationPath = path.resolve(
  repoRoot,
  'prisma',
  'migrations',
  '20260616120000_add_finding_category_fields',
  'migration.sql',
);
const threatMigrationSql = readFileSync(threatMigrationPath, 'utf8');
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

const tempDir = await mkdtemp(path.join(os.tmpdir(), 'appsec-assessments-'));
const databasePath = path.join(tempDir, 'assessments.sqlite');
const adapterUrl = `file:${databasePath.replaceAll('\\', '/')}`;
const prismaClientPath = pathToFileURL(
  path.join(repoRoot, 'generated', 'prisma', 'client.js'),
).href;
const { PrismaClient } = await import(prismaClientPath);

const bootstrapDb = new Database(databasePath);

try {
  bootstrapDb.exec(schemaSql);
  bootstrapDb.exec(threatMigrationSql);
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
  const server = await startTestServer(
    createApiApp(config, {
      assessmentRepository,
      companyRepository,
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

    const createResponse = await fetch(`${server.baseUrl}/api/assessments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
      }),
    });

    assert.equal(createResponse.status, 201);
    assert.equal(
      createResponse.headers
        .get('location')
        ?.startsWith('/api/assessments/asm_'),
      true,
    );
    const createJson = (await createResponse.json()) as {
      data: {
        id: string;
        companyId: string;
        title: string;
        overallRisk?: string;
      };
    };
    assert.equal(createJson.data.id.startsWith('asm_'), true);
    assert.equal(createJson.data.companyId, company.id);
    assert.equal(createJson.data.title, 'Customer Services Portal');

    const assessmentId = createJson.data.id;

    const getResponse = await fetch(
      `${server.baseUrl}/api/assessments/${assessmentId}`,
    );
    assert.equal(getResponse.status, 200);
    const getJson = (await getResponse.json()) as {
      data: { id: string; companyId: string; title: string };
    };
    assert.equal(getJson.data.id, assessmentId);
    assert.equal(getJson.data.companyId, company.id);

    const listResponse = await fetch(`${server.baseUrl}/api/assessments`);
    assert.equal(listResponse.status, 200);
    const listJson = (await listResponse.json()) as {
      data: Array<{ id: string }>;
    };
    assert.equal(listJson.data.length, 1);
    assert.equal(listJson.data[0]?.id, assessmentId);

    const filterResponse = await fetch(
      `${server.baseUrl}/api/assessments?companyId=${company.id}`,
    );
    assert.equal(filterResponse.status, 200);
    const filterJson = (await filterResponse.json()) as {
      data: Array<{ id: string }>;
    };
    assert.equal(filterJson.data.length, 1);
    assert.equal(filterJson.data[0]?.id, assessmentId);

    const patchResponse = await fetch(
      `${server.baseUrl}/api/assessments/${assessmentId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Customer Services Portal - Updated',
          overallRisk: 'medium',
        }),
      },
    );
    assert.equal(patchResponse.status, 200);
    const patchJson = (await patchResponse.json()) as {
      data: { id: string; title: string; overallRisk?: string };
    };
    assert.equal(patchJson.data.id, assessmentId);
    assert.equal(patchJson.data.title, 'Customer Services Portal - Updated');
    assert.equal(patchJson.data.overallRisk, 'medium');

    await prisma.threat.create({
      data: {
        id: 'thr_00000000-0000-0000-0000-000000000001',
        assessmentId,
        title: 'Missing authorization',
        description: 'An authenticated user can access another record.',
        severity: 'high',
        strideCategories: ['spoofing'],
        status: 'open',
      },
    });

    await prisma.evidence.create({
      data: {
        id: 'evd_00000000-0000-0000-0000-000000000001',
        assessmentId,
        type: 'note',
        title: 'Investigation notes',
      },
    });

    const deleteResponse = await fetch(
      `${server.baseUrl}/api/assessments/${assessmentId}`,
      {
        method: 'DELETE',
      },
    );
    assert.equal(deleteResponse.status, 204);
    assert.equal(await deleteResponse.text(), '');

    assert.equal(
      await prisma.threat.count({
        where: { assessmentId },
      }),
      0,
    );
    assert.equal(
      await prisma.evidence.count({
        where: { assessmentId },
      }),
      0,
    );

    const blockedAssessment = await assessmentRepository.create({
      companyId: company.id,
      title: 'Blocked delete assessment',
      description: undefined,
      scope: undefined,
      status: 'draft',
      startedAt: undefined,
      completedAt: undefined,
      applicationName: undefined,
      environment: undefined,
      assessmentType: undefined,
      overallRisk: undefined,
    });

    await prisma.report.create({
      data: {
        id: 'rpt_00000000-0000-0000-0000-000000000001',
        assessmentId: blockedAssessment.id,
        title: 'Blocked delete report',
      },
    });

    const blockedDeleteResponse = await fetch(
      `${server.baseUrl}/api/assessments/${blockedAssessment.id}`,
      {
        method: 'DELETE',
      },
    );
    assert.equal(blockedDeleteResponse.status, 409);
    const blockedDeleteJson = (await blockedDeleteResponse.json()) as {
      error: { code: string; message: string; details: [] };
    };
    assert.deepEqual(blockedDeleteJson, {
      error: {
        code: 'ASSESSMENT_DELETE_CONFLICT',
        message: 'Assessment cannot be deleted while related reports exist',
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

console.log('assessments API integration checks passed');

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
import { createAssessmentRepository } from '../database/repositories/assessment.repository.js';
import { createCompanyRepository } from '../database/repositories/company.repository.js';
import { createEvidenceRepository } from '../database/repositories/evidence.repository.js';
import { createThreatRepository } from '../database/repositories/threat.repository.js';
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

const tempDir = await mkdtemp(path.join(os.tmpdir(), 'appsec-evidence-'));
const databasePath = path.join(tempDir, 'evidence.sqlite');
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

  const company = await companyRepository.create({
    name: 'Northstar Digital',
    description: 'Security consulting and managed assessment services',
    website: 'https://northstar.example',
    contactName: 'Alex Mercer',
    contactEmail: 'security@northstar.example',
    logoPath: '/logos/northstar.svg',
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

  const primaryThreat = await threatRepository.create({
    assessmentId: assessment.id,
    title: 'Missing Server-Side Authorization',
    description: 'The endpoint returns another customer order.',
    severity: 'critical',
    strideCategories: ['spoofing', 'tampering'],
    status: 'accepted-risk',
    affectedAsset: '/api/v1/orders/{id}',
    impact: 'Unauthorised access to customer order data',
    recommendation: 'Apply object-level authorization on every request.',
    observation: 'An authenticated user can access another customer order.',
    affectedComponent: 'Orders API',
    affectedEndpoint: '/api/v1/orders/{id}',
    risk: 'Sensitive order data is exposed.',
  });

  const secondaryThreat = await threatRepository.create({
    assessmentId: assessment.id,
    title: 'Verbose error handling',
    description: 'Detailed errors reveal implementation details.',
    severity: 'medium',
    strideCategories: ['information-disclosure'],
    status: 'open',
    affectedAsset: '/api/v1/debug',
    impact: 'Attackers learn internal details',
    recommendation: 'Return generic errors.',
    observation: 'Stack traces are exposed in debug mode.',
    affectedComponent: 'Debug endpoint',
    affectedEndpoint: '/api/v1/debug',
    risk: 'Implementation details are visible.',
  });

  const server = await startTestServer(
    createApiApp(config, {
      assessmentRepository,
      threatRepository,
      evidenceRepository,
    }),
  );

  try {
    const createResponse = await fetch(`${server.baseUrl}/api/evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assessmentId: assessment.id,
        threatIds: [primaryThreat.id, secondaryThreat.id],
        type: 'screenshot',
        title: 'Evidence screenshot',
        description: 'Portal screenshot',
        content: 'Base64 payload',
        fileName: 'evidence.png',
        mimeType: 'image/png',
        capturedAt: '2026-06-05',
      }),
    });

    assert.equal(createResponse.status, 201);
    const createdJson = (await createResponse.json()) as {
      data: {
        id: string;
        assessmentId: string;
        threatIds: string[];
        filePath?: string;
        storageKey?: string;
      };
    };
    assert.equal(createdJson.data.id.startsWith('evd_'), true);
    assert.equal(createdJson.data.assessmentId, assessment.id);
    assert.deepEqual(
      createdJson.data.threatIds.sort(),
      [primaryThreat.id, secondaryThreat.id].sort(),
    );
    assert.equal(
      createdJson.data.filePath?.startsWith(
        `uploads/evidence/${createdJson.data.id}/`,
      ),
      true,
    );
    assert.equal(createdJson.data.storageKey, createdJson.data.filePath);

    const evidenceId = createdJson.data.id;

    const listResponse = await fetch(
      `${server.baseUrl}/api/evidence?assessmentId=${assessment.id}`,
    );
    assert.equal(listResponse.status, 200);
    const listJson = (await listResponse.json()) as {
      data: Array<{ id: string }>;
    };
    assert.equal(listJson.data.length, 1);
    assert.equal(listJson.data[0]?.id, evidenceId);

    const getResponse = await fetch(
      `${server.baseUrl}/api/evidence/${evidenceId}`,
    );
    assert.equal(getResponse.status, 200);
    const getJson = (await getResponse.json()) as {
      data: { id: string; filePath?: string; storageKey?: string };
    };
    assert.equal(getJson.data.id, evidenceId);
    assert.equal(
      getJson.data.filePath?.startsWith(`uploads/evidence/${evidenceId}/`),
      true,
    );
    assert.equal(getJson.data.storageKey, getJson.data.filePath);

    const patchResponse = await fetch(
      `${server.baseUrl}/api/evidence/${evidenceId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Updated evidence title',
          threatIds: [secondaryThreat.id],
          fileName: 'updated-evidence.png',
        }),
      },
    );
    assert.equal(patchResponse.status, 200);
    const patchJson = (await patchResponse.json()) as {
      data: {
        id: string;
        title: string;
        threatIds: string[];
        filePath?: string;
        storageKey?: string;
      };
    };
    assert.equal(patchJson.data.id, evidenceId);
    assert.equal(patchJson.data.title, 'Updated evidence title');
    assert.deepEqual(patchJson.data.threatIds, [secondaryThreat.id]);
    assert.equal(
      patchJson.data.filePath?.startsWith(`uploads/evidence/${evidenceId}/`),
      true,
    );
    assert.equal(patchJson.data.storageKey, patchJson.data.filePath);

    const storedEvidence = await prisma.evidence.findUnique({
      where: { id: evidenceId },
      select: {
        threatLinks: {
          select: { threatId: true },
          orderBy: { threatId: 'asc' },
        },
      },
    });
    assert.deepEqual(
      storedEvidence?.threatLinks.map(
        (link: { threatId: string }) => link.threatId,
      ),
      [secondaryThreat.id],
    );

    const httpEvidenceResponse = await fetch(`${server.baseUrl}/api/evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assessmentId: assessment.id,
        type: 'http',
        title: 'HTTP exchange evidence',
        httpExchanges: [
          {
            request: {
              method: 'GET',
              url: '/api/v1/orders/1',
            },
            response: {
              statusCode: 200,
              body: '{"ok":true}',
            },
          },
          {
            request: {
              method: 'POST',
              url: '/api/v1/orders/1',
              body: '{"confirm":true}',
            },
            response: {
              statusCode: 201,
              body: '{"created":true}',
            },
          },
        ],
      }),
    });

    assert.equal(httpEvidenceResponse.status, 201);
    const httpEvidenceJson = (await httpEvidenceResponse.json()) as {
      data: {
        id: string;
        httpExchanges: Array<{
          request: { method: string; url: string; body?: string };
          response: { statusCode: number; body?: string };
        }>;
      };
    };
    assert.equal(httpEvidenceJson.data.id.startsWith('evd_'), true);
    assert.equal(httpEvidenceJson.data.httpExchanges.length, 2);
    assert.equal(httpEvidenceJson.data.httpExchanges[0]?.request.method, 'GET');
    assert.equal(
      httpEvidenceJson.data.httpExchanges[1]?.response.statusCode,
      201,
    );

    const storedHttpEvidence = await prisma.evidence.findUnique({
      where: { id: httpEvidenceJson.data.id },
      include: {
        httpExchanges: {
          orderBy: { position: 'asc' },
          select: {
            position: true,
            request: true,
            response: true,
          },
        },
      },
    });
    assert.deepEqual(
      storedHttpEvidence?.httpExchanges.map(
        (exchange: {
          request: { method: string };
          response: { statusCode: number };
        }) => exchange.request.method,
      ),
      ['GET', 'POST'],
    );

    const invalidClearResponse = await fetch(
      `${server.baseUrl}/api/evidence/${httpEvidenceJson.data.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'http',
          httpExchanges: [],
        }),
      },
    );
    assert.equal(invalidClearResponse.status, 400);
    const invalidClearJson = (await invalidClearResponse.json()) as {
      error: {
        code: string;
        message: string;
        details: Array<{ path: string }>;
      };
    };
    assert.equal(invalidClearJson.error.code, 'VALIDATION_ERROR');

    const storedAfterFailedClear = await prisma.evidence.findUnique({
      where: { id: httpEvidenceJson.data.id },
      include: {
        httpExchanges: {
          orderBy: { position: 'asc' },
          select: {
            position: true,
            request: true,
            response: true,
          },
        },
      },
    });
    assert.deepEqual(
      storedAfterFailedClear?.httpExchanges.map(
        (exchange: {
          request: { method: string };
          response: { statusCode: number };
        }) => exchange.request.method,
      ),
      ['GET', 'POST'],
    );

    const clearHttpExchangesResponse = await fetch(
      `${server.baseUrl}/api/evidence/${httpEvidenceJson.data.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'text',
          httpExchanges: [],
        }),
      },
    );
    assert.equal(clearHttpExchangesResponse.status, 200);
    const clearedEvidenceJson = (await clearHttpExchangesResponse.json()) as {
      data: {
        type: string;
        httpExchanges: Array<{
          request: { method: string; url: string; body?: string };
          response: { statusCode: number; body?: string };
        }>;
      };
    };
    assert.equal(clearedEvidenceJson.data.type, 'text');
    assert.deepEqual(clearedEvidenceJson.data.httpExchanges, []);

    const storedClearedEvidence = await prisma.evidence.findUnique({
      where: { id: httpEvidenceJson.data.id },
      include: {
        httpExchanges: {
          orderBy: { position: 'asc' },
          select: {
            position: true,
            request: true,
            response: true,
          },
        },
      },
    });
    assert.equal(storedClearedEvidence?.httpExchanges.length, 0);

    const deleteResponse = await fetch(
      `${server.baseUrl}/api/evidence/${evidenceId}`,
      {
        method: 'DELETE',
      },
    );
    assert.equal(deleteResponse.status, 204);
    assert.equal(await deleteResponse.text(), '');

    const missingAfterDelete = await fetch(
      `${server.baseUrl}/api/evidence/${evidenceId}`,
    );
    assert.equal(missingAfterDelete.status, 404);
  } finally {
    await server.close();
  }
} finally {
  await prisma.$disconnect();
  await rm(tempDir, { recursive: true, force: true });
}

console.log('evidence API integration checks passed');

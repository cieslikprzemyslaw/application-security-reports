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
import { createCompanyRepository } from '../database/repositories/company.repository.js';
import { createAssessmentRepository } from '../database/repositories/assessment.repository.js';
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

const tempDir = await mkdtemp(path.join(os.tmpdir(), 'appsec-companies-'));
const databasePath = path.join(tempDir, 'companies.sqlite');
const adapterUrl = `file:${databasePath.replaceAll('\\', '/')}`;
const prismaClientPath = pathToFileURL(
  path.join(repoRoot, 'generated', 'prisma', 'client.js'),
).href;
const { PrismaClient } = await import(prismaClientPath);

const bootstrapDb = new Database(databasePath);

try {
  bootstrapDb.exec(schemaSql);
} finally {
  bootstrapDb.close();
}

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: adapterUrl }),
});

try {
  await prisma.$executeRawUnsafe('PRAGMA journal_mode = MEMORY');
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');

  const repository = createCompanyRepository(prisma);
  const server = await startTestServer(
    createApiApp(config, {
      companyRepository: repository,
    }),
  );

  try {
    const createResponse = await fetch(`${server.baseUrl}/api/companies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Northstar Digital',
        description: 'Security consulting and managed assessment services',
        website: 'https://northstar.example',
        contactName: 'Alex Mercer',
        contactEmail: 'security@northstar.example',
        logoPath: '/logos/northstar.svg',
        footerText: 'Confidential - do not distribute.',
      }),
    });

    assert.equal(createResponse.status, 201);
    const createdJson = (await createResponse.json()) as {
      data: {
        id: string;
        name: string;
        createdAt: string;
        updatedAt: string;
      };
    };
    assert.equal(createdJson.data.id.startsWith('cmp_'), true);
    assert.equal(createdJson.data.name, 'Northstar Digital');

    const companyId = createdJson.data.id;

    const listResponse = await fetch(`${server.baseUrl}/api/companies`);
    assert.equal(listResponse.status, 200);
    const listJson = (await listResponse.json()) as {
      data: Array<{ id: string; name: string }>;
    };
    assert.equal(listJson.data.length, 1);
    assert.equal(listJson.data[0]?.id, companyId);

    const getResponse = await fetch(
      `${server.baseUrl}/api/companies/${companyId}`,
    );
    assert.equal(getResponse.status, 200);
    const getJson = (await getResponse.json()) as {
      data: { id: string; name: string; website?: string };
    };
    assert.equal(getJson.data.id, companyId);
    assert.equal(getJson.data.website, 'https://northstar.example');

    const patchResponse = await fetch(
      `${server.baseUrl}/api/companies/${companyId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Northstar Security',
          footerText: 'Confidential - updated.',
        }),
      },
    );
    assert.equal(patchResponse.status, 200);
    const patchJson = (await patchResponse.json()) as {
      data: { id: string; name: string; footerText?: string };
    };
    assert.equal(patchJson.data.id, companyId);
    assert.equal(patchJson.data.name, 'Northstar Security');
    assert.equal(patchJson.data.footerText, 'Confidential - updated.');

    const deleteResponse = await fetch(
      `${server.baseUrl}/api/companies/${companyId}`,
      {
        method: 'DELETE',
      },
    );
    assert.equal(deleteResponse.status, 204);
    assert.equal(await deleteResponse.text(), '');

    const missingAfterDelete = await fetch(
      `${server.baseUrl}/api/companies/${companyId}`,
    );
    assert.equal(missingAfterDelete.status, 404);

    const blockedCompany = await repository.create({
      name: 'Blocked Partner',
      description: undefined,
      website: undefined,
      contactName: undefined,
      contactEmail: undefined,
      logoPath: undefined,
      footerText: undefined,
    });

    await prisma.assessment.create({
      data: {
        id: 'asm_00000000-0000-0000-0000-000000000001',
        companyId: blockedCompany.id,
        title: 'Blocked delete assessment',
        status: 'draft',
      },
    });

    const blockedDeleteResponse = await fetch(
      `${server.baseUrl}/api/companies/${blockedCompany.id}`,
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
        code: 'COMPANY_DELETE_CONFLICT',
        message: 'Company cannot be deleted while related assessments exist',
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

{
  const overviewTempDir = await mkdtemp(
    path.join(os.tmpdir(), 'appsec-companies-overview-'),
  );
  const overviewDbPath = path.join(overviewTempDir, 'overview.sqlite');
  const overviewAdapterUrl = `file:${overviewDbPath.replaceAll('\\', '/')}`;

  const overviewBootstrap = new Database(overviewDbPath);

  try {
    overviewBootstrap.exec(schemaSql);
  } finally {
    overviewBootstrap.close();
  }

  const overviewPrisma = new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: overviewAdapterUrl }),
  });

  try {
    await overviewPrisma.$executeRawUnsafe('PRAGMA journal_mode = MEMORY');
    await overviewPrisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');

    const companyRepo = createCompanyRepository(overviewPrisma);
    const assessmentRepo = createAssessmentRepository(overviewPrisma);
    const overviewServer = await startTestServer(
      createApiApp(config, {
        companyRepository: companyRepo,
        assessmentRepository: assessmentRepo,
      }),
    );

    try {
      const overviewCompany = await companyRepo.create({
        name: 'Overview Corp',
        description: undefined,
        website: undefined,
        contactName: undefined,
        contactEmail: undefined,
        logoPath: undefined,
        footerText: undefined,
      });

      await assessmentRepo.create({
        companyId: overviewCompany.id,
        title: 'Draft Assessment',
        status: 'draft',
        description: undefined,
        scope: undefined,
        startedAt: undefined,
        completedAt: undefined,
        applicationName: 'Admin Panel',
        environment: undefined,
        assessmentType: 'Web App',
        overallRisk: 'high',
      });

      await assessmentRepo.create({
        companyId: overviewCompany.id,
        title: 'In Progress Assessment',
        status: 'in-progress',
        description: undefined,
        scope: undefined,
        startedAt: undefined,
        completedAt: undefined,
        applicationName: 'Customer Portal',
        environment: undefined,
        assessmentType: 'Web App',
        overallRisk: 'medium',
      });

      const overviewResponse = await fetch(
        `${overviewServer.baseUrl}/api/companies/${overviewCompany.id}/overview`,
      );

      assert.equal(overviewResponse.status, 200);
      const overviewJson = (await overviewResponse.json()) as {
        data: {
          company: { id: string; name: string };
          assessmentCounts: {
            total: number;
            draft: number;
            inProgress: number;
            completed: number;
          };
          recentAssessments: Array<{
            id: string;
            status: string;
            findingsCount: number;
          }>;
          recentReports: null;
        };
      };

      assert.equal(overviewJson.data.company.id, overviewCompany.id);
      assert.equal(overviewJson.data.company.name, 'Overview Corp');
      assert.equal(overviewJson.data.assessmentCounts.total, 2);
      assert.equal(overviewJson.data.assessmentCounts.draft, 1);
      assert.equal(overviewJson.data.assessmentCounts.inProgress, 1);
      assert.equal(overviewJson.data.assessmentCounts.completed, 0);
      assert.equal(overviewJson.data.recentAssessments.length, 2);
      assert.equal(overviewJson.data.recentAssessments[0]?.findingsCount, 0);
      assert.equal(overviewJson.data.recentReports, null);

      const notFoundResponse = await fetch(
        `${overviewServer.baseUrl}/api/companies/cmp_00000000-0000-0000-0000-000000000099/overview`,
      );

      assert.equal(notFoundResponse.status, 404);
      assert.deepEqual(await notFoundResponse.json(), {
        error: {
          code: 'COMPANY_NOT_FOUND',
          message: 'Company not found',
          details: [],
        },
      });
    } finally {
      await overviewServer.close();
    }
  } finally {
    await overviewPrisma.$disconnect();
    await rm(overviewTempDir, { recursive: true, force: true });
  }
}

console.log('companies API integration checks passed');

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
import { createSettingsRepository } from '../database/repositories/settings.repository.js';
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

const tempDir = await mkdtemp(path.join(os.tmpdir(), 'appsec-settings-'));
const databasePath = path.join(tempDir, 'settings.sqlite');
const adapterUrl = `file:${databasePath.replaceAll('\\', '/')}`;
const prismaClientPath = pathToFileURL(
  path.join(repoRoot, 'generated', 'prisma', 'client.js'),
).href;
const { PrismaClient } = await import(prismaClientPath);

const bootstrapDb = new Database(databasePath);

try {
  bootstrapDb.exec(schemaSql);
  bootstrapDb.exec(settingsBrandingMigrationSql);
} finally {
  bootstrapDb.close();
}

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: adapterUrl }),
});

try {
  await prisma.$executeRawUnsafe('PRAGMA journal_mode = MEMORY');
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');

  const repository = createSettingsRepository(prisma);
  const seededSettings = await repository.upsert({
    organisationName: 'Northstar Digital',
    consultantName: 'Alex Mercer',
    consultantEmail: 'alex.mercer@appsec.io',
    issuerLogoId: 'logo_00000000-0000-0000-0000-000000000001',
    defaultReportTitle: 'Application Security Assessment',
    defaultSeverity: 'medium',
    theme: 'system',
    dateFormat: 'YYYY-MM-DD',
    reportFooterText:
      '(c) 2026 Northstar Digital. Confidential - do not distribute.',
    reportConfidentialityLabel: 'Confidential',
    methodology: 'OWASP ASVS / WSTG',
    reportStyle: 'Technical & structured',
    includeEvidence: true,
    confidentialReports: true,
    allowedBrandingModes: ['issuer', 'client'],
    defaultBrandingMode: 'issuer',
  });

  const server = await startTestServer(
    createApiApp(config, {
      settingsRepository: repository,
    }),
  );

  try {
    const getResponse = await fetch(`${server.baseUrl}/api/settings`);

    assert.equal(getResponse.status, 200);
    const getJson = (await getResponse.json()) as {
      data: { id: string; defaultReportTitle: string; theme: string };
    };
    assert.equal(getJson.data.id, seededSettings.id);
    assert.equal(
      getJson.data.defaultReportTitle,
      seededSettings.defaultReportTitle,
    );

    const patchResponse = await fetch(`${server.baseUrl}/api/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        defaultReportTitle: 'Updated application security assessment',
        includeEvidence: false,
        issuerLogoId: 'logo_00000000-0000-0000-0000-000000000002',
        defaultBrandingMode: 'client',
      }),
    });

    assert.equal(patchResponse.status, 200);
    const patchJson = (await patchResponse.json()) as {
      data: {
        id: string;
        defaultReportTitle: string;
        includeEvidence: boolean;
        issuerLogoId?: string;
        defaultBrandingMode?: string;
      };
    };
    assert.equal(patchJson.data.id, seededSettings.id);
    assert.equal(
      patchJson.data.defaultReportTitle,
      'Updated application security assessment',
    );
    assert.equal(patchJson.data.includeEvidence, false);
    assert.equal(
      patchJson.data.issuerLogoId,
      'logo_00000000-0000-0000-0000-000000000002',
    );
    assert.equal(patchJson.data.defaultBrandingMode, 'client');

    const updatedResponse = await fetch(`${server.baseUrl}/api/settings`);
    assert.equal(updatedResponse.status, 200);
    const updatedJson = (await updatedResponse.json()) as {
      data: {
        defaultReportTitle: string;
        includeEvidence: boolean;
        issuerLogoId?: string;
        defaultBrandingMode?: string;
      };
    };
    assert.equal(
      updatedJson.data.defaultReportTitle,
      'Updated application security assessment',
    );
    assert.equal(updatedJson.data.includeEvidence, false);
    assert.equal(
      updatedJson.data.issuerLogoId,
      'logo_00000000-0000-0000-0000-000000000002',
    );
    assert.equal(updatedJson.data.defaultBrandingMode, 'client');
    assert.equal(await prisma.settings.count(), 1);

    const invalidPatchResponse = await fetch(`${server.baseUrl}/api/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        issuerLogoId: '../uploads/logo.svg',
      }),
    });

    assert.equal(invalidPatchResponse.status, 400);
    const afterInvalidResponse = await fetch(`${server.baseUrl}/api/settings`);
    assert.equal(afterInvalidResponse.status, 200);
    const afterInvalidJson = (await afterInvalidResponse.json()) as {
      data: { issuerLogoId?: string };
    };
    assert.equal(
      afterInvalidJson.data.issuerLogoId,
      'logo_00000000-0000-0000-0000-000000000002',
    );
  } finally {
    await server.close();
  }
} finally {
  await prisma.$disconnect();
  await rm(tempDir, { recursive: true, force: true });
}

console.log('settings API integration checks passed');

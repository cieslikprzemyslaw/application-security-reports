import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { describe, expect, it } from 'vitest';

import { loadServerConfig } from '../config.js';
import { createSettingsRepository } from '../database/repositories/settings.repository.js';
import { createIssuerLogoStorage } from '../services/issuerLogoStorage.js';
import { createApiApp } from './api-app.js';

const pngBytes = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);
const webpBytes = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);

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
const settingsBrandingMigrationSql = readFileSync(
  path.resolve(
    repoRoot,
    'prisma',
    'migrations',
    '20260617120000_extend_settings_branding',
    'migration.sql',
  ),
  'utf8',
);
const reportVersionMigrationSql = readFileSync(
  path.resolve(
    repoRoot,
    'prisma',
    'migrations',
    '20260621120000_add_report_version',
    'migration.sql',
  ),
  'utf8',
);

const config = loadServerConfig({
  FRONTEND_ORIGIN: 'http://localhost:5173',
});

const nodeRequire = createRequire(import.meta.url);
const Database = nodeRequire('better-sqlite3') as new (
  databasePath: string,
) => {
  exec(sql: string): void;
  close(): void;
};

const startTestServer = async (app: ReturnType<typeof createApiApp>) => {
  const server = createServer(app);

  await new Promise<void>(resolve => {
    server.listen(0, resolve);
  });

  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Expected an ephemeral test port.');
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: async () =>
      new Promise<void>((resolve, reject) => {
        server.close(error => (error ? reject(error) : resolve()));
      }),
  };
};

describe('issuer logo API integration', () => {
  it('persists upload, read, replacement, restart, and deletion consistently', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'issuer-logo-api-'));
    const databasePath = path.join(tempDir, 'settings.sqlite');
    const adapterUrl = `file:${databasePath.replaceAll('\\', '/')}`;
    const storageRoot = path.posix.join(
      'uploads',
      `issuer-logo-integration-${randomUUID()}`,
    );
    const storagePath = path.resolve(repoRoot, storageRoot);
    const prismaClientPath = pathToFileURL(
      path.join(repoRoot, 'generated', 'prisma', 'client.js'),
    ).href;
    const { PrismaClient } = await import(prismaClientPath);
    const bootstrapDb = new Database(databasePath);

    try {
      bootstrapDb.exec(schemaSql);
      bootstrapDb.exec(settingsBrandingMigrationSql);
      bootstrapDb.exec(reportVersionMigrationSql);
    } finally {
      bootstrapDb.close();
    }

    const prisma = new PrismaClient({
      adapter: new PrismaBetterSqlite3({ url: adapterUrl }),
    });
    const storage = createIssuerLogoStorage({ rootDirectory: storageRoot });
    let server: Awaited<ReturnType<typeof startTestServer>> | undefined;

    try {
      await prisma.$executeRawUnsafe('PRAGMA journal_mode = MEMORY');
      await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');

      const repository = createSettingsRepository(prisma);
      await repository.upsert({
        organisationName: 'Northstar Digital',
        consultantName: 'Alex Mercer',
        consultantEmail: 'alex.mercer@appsec.io',
        defaultReportTitle: 'Application Security Assessment',
        defaultSeverity: 'medium',
        theme: 'system',
        dateFormat: 'YYYY-MM-DD',
        reportFooterText: 'Confidential',
        reportConfidentialityLabel: 'Confidential',
        methodology: 'OWASP ASVS / WSTG',
        reportStyle: 'Technical & structured',
        includeEvidence: true,
        confidentialReports: true,
        allowedBrandingModes: ['issuer', 'client'],
        defaultBrandingMode: 'issuer',
      });

      server = await startTestServer(
        createApiApp(config, {
          settingsRepository: repository,
          issuerLogoStorage: storage,
        }),
      );

      const uploadResponse = await fetch(
        `${server.baseUrl}/api/settings/issuer-logo`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'image/png',
            'X-File-Name': 'issuer-logo.png',
          },
          body: pngBytes,
        },
      );
      expect(uploadResponse.status).toBe(200);
      const uploadBody = (await uploadResponse.json()) as {
        data: { issuerLogoId: string };
      };
      const firstLogoId = uploadBody.data.issuerLogoId;
      expect(firstLogoId).toMatch(/^logo_[0-9a-f-]{36}$/);

      const readResponse = await fetch(
        `${server.baseUrl}/api/settings/issuer-logo`,
      );
      expect(readResponse.status).toBe(200);
      expect(readResponse.headers.get('content-type')).toBe('image/png');
      expect(Buffer.from(await readResponse.arrayBuffer())).toEqual(pngBytes);

      await server.close();
      server = await startTestServer(
        createApiApp(config, {
          settingsRepository: repository,
          issuerLogoStorage: storage,
        }),
      );

      const afterRestartResponse = await fetch(
        `${server.baseUrl}/api/settings/issuer-logo`,
      );
      expect(afterRestartResponse.status).toBe(200);
      expect(Buffer.from(await afterRestartResponse.arrayBuffer())).toEqual(
        pngBytes,
      );

      const replaceResponse = await fetch(
        `${server.baseUrl}/api/settings/issuer-logo`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'image/webp',
            'X-File-Name': 'issuer-logo.webp',
          },
          body: webpBytes,
        },
      );
      expect(replaceResponse.status).toBe(200);
      const replaceBody = (await replaceResponse.json()) as {
        data: { issuerLogoId: string };
      };
      expect(replaceBody.data.issuerLogoId).not.toBe(firstLogoId);
      await expect(storage.readIssuerLogoFile(firstLogoId)).rejects.toThrow();

      const replacedReadResponse = await fetch(
        `${server.baseUrl}/api/settings/issuer-logo`,
      );
      expect(replacedReadResponse.headers.get('content-type')).toBe(
        'image/webp',
      );
      expect(Buffer.from(await replacedReadResponse.arrayBuffer())).toEqual(
        webpBytes,
      );

      const deleteResponse = await fetch(
        `${server.baseUrl}/api/settings/issuer-logo`,
        { method: 'DELETE' },
      );
      expect(deleteResponse.status).toBe(204);
      expect((await repository.get())?.issuerLogoId).toBeUndefined();

      const missingResponse = await fetch(
        `${server.baseUrl}/api/settings/issuer-logo`,
      );
      expect(missingResponse.status).toBe(404);
      expect((await missingResponse.json()) as unknown).toEqual({
        error: {
          code: 'ISSUER_LOGO_NOT_FOUND',
          message: 'Issuer logo not found',
          details: [],
        },
      });

      expect(await prisma.company.count()).toBe(0);
      expect(await prisma.report.count()).toBe(0);
      expect(await prisma.reportVersion.count()).toBe(0);
    } finally {
      await server?.close().catch(() => undefined);
      await prisma.$disconnect();
      await rm(storagePath, { recursive: true, force: true });
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

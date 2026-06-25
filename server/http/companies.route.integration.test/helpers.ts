import { readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

import { loadServerConfig } from '../../config.js';
import { createApiApp } from '../api-app.js';

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

export const config = loadServerConfig({
  FRONTEND_ORIGIN: 'http://localhost:5173',
});

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
    baseUrl: 'http://127.0.0.1:' + address.port,
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

export const startCompanyApiServer = async (
  dependencies: NonNullable<Parameters<typeof createApiApp>[1]>,
) => startTestServer(createApiApp(config, dependencies));

export const createIntegrationDatabase = async (prefix: string) => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), prefix));
  const databasePath = path.join(tempDir, 'test.sqlite');
  const adapterUrl = 'file:' + databasePath.replaceAll('\\', '/');
  const bootstrapDb = new Database(databasePath);

  try {
    bootstrapDb.exec(schemaSql);
    bootstrapDb.exec(companyLogoMigrationSql);
    bootstrapDb.exec(assessmentMigrationSql);
    bootstrapDb.exec(threatMigrationSql);
    bootstrapDb.exec(evidenceMigrationSql);
    bootstrapDb.exec(reportVersionMigrationSql);
    bootstrapDb.exec(companyArchivedAtMigrationSql);
  } finally {
    bootstrapDb.close();
  }

  const prisma = new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: adapterUrl }),
  });

  await prisma.$executeRawUnsafe('PRAGMA journal_mode = MEMORY');
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');

  return {
    prisma,
    tempDir,
    cleanup: async () => {
      await prisma.$disconnect();
      await rm(tempDir, { recursive: true, force: true });
    },
  };
};

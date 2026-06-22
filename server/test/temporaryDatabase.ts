import { createRequire } from 'node:module';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../../generated/prisma/client.js';

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3') as new (databasePath: string) => {
  pragma(sql: string): unknown;
  exec(sql: string): void;
  close(): void;
};

const migrationsRoot = fileURLToPath(
  new URL('../../prisma/migrations/', import.meta.url),
);

const getMigrationFiles = () =>
  readdirSync(migrationsRoot, {
    withFileTypes: true,
  })
    .filter(entry => entry.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name))
    .map(entry => path.join(migrationsRoot, entry.name, 'migration.sql'));

const applyMigrations = (databasePath: string) => {
  const database = new Database(databasePath);

  try {
    database.pragma('journal_mode = MEMORY');

    for (const migrationFile of getMigrationFiles()) {
      database.exec(readFileSync(migrationFile, 'utf8'));
    }

    database.pragma('foreign_keys = ON');
  } finally {
    database.close();
  }
};

const toSqliteUrl = (databasePath: string) =>
  `file:${databasePath.replaceAll('\\', '/')}`;

export const createTemporaryDatabase = async () => {
  const directory = mkdtempSync(
    path.join(tmpdir(), 'appsec-report-builder-tests-'),
  );
  const databasePath = path.join(directory, 'test.db');

  applyMigrations(databasePath);

  const adapter = new PrismaBetterSqlite3({
    url: toSqliteUrl(databasePath),
  });
  const prisma = new PrismaClient({ adapter });

  await prisma.$executeRawUnsafe('PRAGMA journal_mode = MEMORY');
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');

  let cleanedUp = false;

  return {
    prisma,
    databasePath,
    async cleanup() {
      if (cleanedUp) {
        return;
      }

      cleanedUp = true;
      await prisma.$disconnect();
      rmSync(directory, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 50,
      });
    },
  };
};

export type TemporaryDatabase = Awaited<
  ReturnType<typeof createTemporaryDatabase>
>;

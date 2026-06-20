import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repoRoot = process.cwd();
const buildDir = path.resolve(repoRoot, '.tmp', 'appsec-db-build');
const generatedPrismaDir = path.join(buildDir, 'generated', 'prisma');
const require = createRequire(import.meta.url);
const betterSqlite3ModulePath = require.resolve('better-sqlite3');
const OriginalDatabase = require('better-sqlite3');

const appendJsExtension = content =>
  content.replace(/from (['"])\.(\/[^'"\n]+)\1/g, (_, quote, specifier) => {
    if (/\.(?:js|mjs|cjs|json)$/.test(specifier)) {
      return `from ${quote}.${specifier}${quote}`;
    }

    return `from ${quote}.${specifier}.js${quote}`;
  });

const patchGeneratedFiles = directory => {
  for (const entry of readdirSync(directory)) {
    const fullPath = path.join(directory, entry);
    const entryStat = statSync(fullPath);

    if (entryStat.isDirectory()) {
      patchGeneratedFiles(fullPath);
      continue;
    }

    if (!entry.endsWith('.js')) {
      continue;
    }

    const original = readFileSync(fullPath, 'utf8');
    const patched = appendJsExtension(original);

    if (patched !== original) {
      writeFileSync(fullPath, patched);
    }
  }
};

if (!path.isAbsolute(buildDir)) {
  throw new Error('Build directory must resolve to an absolute path.');
}

function PatchedDatabase(filenameGiven, options) {
  const database = new OriginalDatabase(filenameGiven, options);
  database.pragma('journal_mode = MEMORY');
  database.pragma('foreign_keys = ON');
  return database;
}

PatchedDatabase.prototype = OriginalDatabase.prototype;
Object.setPrototypeOf(PatchedDatabase, OriginalDatabase);
require.cache[betterSqlite3ModulePath].exports = PatchedDatabase;

patchGeneratedFiles(generatedPrismaDir);

process.env.APPSEC_BUILD_DIR = buildDir;
process.env.DATABASE_URL ??= `file:${path.resolve(repoRoot, '.tmp', 'appsec-db.sqlite')}`;

const testFiles = [
  'server/database/errors.test.js',
  'server/database/repositories/repositories.test.js',
  'server/database/repositories/repositories.test.company-assessment-threat.js',
  'server/database/repositories/repositories.test.evidence-report-settings.js',
  'server/database/repositories/repositories.integration.test.js',
  'server/database/seed.test.js',
];

for (const testFile of testFiles) {
  await import(pathToFileURL(path.join(buildDir, testFile)).href);
}

import assert from 'node:assert/strict';
import { cp, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

import { SeedInputError, seedDatabase } from '../../prisma/seed.js';

const buildDir = process.env.APPSEC_BUILD_DIR;
const databaseUrl = process.env.DATABASE_URL;

if (!buildDir) {
  throw new Error('APPSEC_BUILD_DIR must be set for seed tests.');
}

if (!databaseUrl) {
  throw new Error('DATABASE_URL must be set for seed tests.');
}

const repoRoot = path.resolve(buildDir, '..', '..');
const npmCliPath =
  process.env.npm_execpath ??
  path.resolve(repoRoot, 'node_modules', 'npm', 'bin', 'npm-cli.js');
const npxCliPath = path.join(path.dirname(npmCliPath), 'npx-cli.js');
const sourceSeedDir = path.resolve(repoRoot, 'prisma', 'seed');
const prismaTestEnv =
  process.platform === 'win32'
    ? {
        RUST_BACKTRACE: '1',
        RUST_LOG: 'debug',
      }
    : {};

const runPrismaCommand = (args: string[]) => {
  const result = spawnSync(process.execPath, [npxCliPath, 'prisma', ...args], {
    cwd: repoRoot,
    env: {
      ...process.env,
      DATABASE_URL: prismaDatabaseUrl,
      ...prismaTestEnv,
    },
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(
      [
        `Prisma command failed: ${args.join(' ')}`,
        result.stdout?.trim(),
        result.stderr?.trim(),
      ]
        .filter(Boolean)
        .join('\n'),
    );
  }

  return result;
};

const runNpmScript = (args: string[]) => {
  const result = spawnSync(process.execPath, [npmCliPath, ...args], {
    cwd: repoRoot,
    env: {
      ...process.env,
      DATABASE_URL: prismaDatabaseUrl,
      ...prismaTestEnv,
    },
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(
      [
        `npm command failed: ${args.join(' ')}`,
        result.stdout?.trim(),
        result.stderr?.trim(),
      ]
        .filter(Boolean)
        .join('\n'),
    );
  }

  return result;
};

const getSnapshot = async (prisma: {
  company: {
    findMany: (args: unknown) => Promise<Array<{ id: string }>>;
  };
  assessment: {
    findMany: (args: unknown) => Promise<Array<{ id: string }>>;
  };
  threat: {
    findMany: (args: unknown) => Promise<Array<{ id: string }>>;
  };
  evidence: {
    findMany: (args: unknown) => Promise<Array<{ id: string }>>;
    findUnique: (args: unknown) => Promise<{
      id: string;
      threatLinks: Array<{ threatId: string }>;
    } | null>;
  };
  report: {
    findMany: (args: unknown) => Promise<Array<{ id: string }>>;
    findUnique: (args: unknown) => Promise<{
      id: string;
      selectedThreats: Array<{ threatId: string }>;
    } | null>;
  };
  reportThreat: {
    findMany: (
      args: unknown,
    ) => Promise<Array<{ reportId: string; threatId: string }>>;
  };
  evidenceThreat: {
    findMany: (
      args: unknown,
    ) => Promise<Array<{ evidenceId: string; threatId: string }>>;
  };
  activity: {
    findMany: (args: unknown) => Promise<Array<{ id: string }>>;
  };
  settings: {
    findMany: (args: unknown) => Promise<Array<{ id: string }>>;
  };
}) => {
  const [
    companies,
    assessments,
    threats,
    evidence,
    reports,
    reportThreats,
    evidenceThreats,
    activities,
    settings,
  ] = await Promise.all([
    prisma.company.findMany({ orderBy: { id: 'asc' }, select: { id: true } }),
    prisma.assessment.findMany({
      orderBy: { id: 'asc' },
      select: { id: true },
    }),
    prisma.threat.findMany({ orderBy: { id: 'asc' }, select: { id: true } }),
    prisma.evidence.findMany({ orderBy: { id: 'asc' }, select: { id: true } }),
    prisma.report.findMany({ orderBy: { id: 'asc' }, select: { id: true } }),
    prisma.reportThreat.findMany({
      orderBy: [{ reportId: 'asc' }, { threatId: 'asc' }],
      select: { reportId: true, threatId: true },
    }),
    prisma.evidenceThreat.findMany({
      orderBy: [{ evidenceId: 'asc' }, { threatId: 'asc' }],
      select: { evidenceId: true, threatId: true },
    }),
    prisma.activity.findMany({ orderBy: { id: 'asc' }, select: { id: true } }),
    prisma.settings.findMany({ orderBy: { id: 'asc' }, select: { id: true } }),
  ]);

  const report = await prisma.report.findUnique({
    where: {
      id: 'rpt_00000000-0000-0000-0000-000000000001',
    },
    include: {
      selectedThreats: {
        orderBy: { threatId: 'asc' },
        select: { threatId: true },
      },
    },
  });

  const evidenceRow = await prisma.evidence.findUnique({
    where: {
      id: 'evd_00000000-0000-0000-0000-000000000001',
    },
    include: {
      threatLinks: {
        orderBy: { threatId: 'asc' },
        select: { threatId: true },
      },
    },
  });

  return {
    companies: companies.map(row => row.id),
    assessments: assessments.map(row => row.id),
    threats: threats.map(row => row.id),
    evidence: evidence.map(row => row.id),
    reports: reports.map(row => row.id),
    reportThreats,
    evidenceThreats,
    activities: activities.map(row => row.id),
    settings: settings.map(row => row.id),
    reportThreatIds: report?.selectedThreats.map(row => row.threatId) ?? [],
    evidenceThreatIds: evidenceRow?.threatLinks.map(row => row.threatId) ?? [],
  };
};

const tempDir = await mkdtemp(path.join(os.tmpdir(), 'appsec-seed-'));
const tempSeedDir = path.join(tempDir, 'seed');
const databasePath = path.join(tempDir, 'seed.sqlite');
const prismaDatabaseUrl = `file:${databasePath.replaceAll('\\', '/')}`;
const adapterDatabaseUrl = prismaDatabaseUrl;
const seedBuildClientPath = pathToFileURL(
  path.join(buildDir, 'generated', 'prisma', 'client.js'),
).href;
const { PrismaClient } = await import(seedBuildClientPath);

try {
  await cp(sourceSeedDir, tempSeedDir, { recursive: true });

  runPrismaCommand(['migrate', 'deploy']);

  const prisma = new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: adapterDatabaseUrl }),
  });

  try {
    await prisma.$executeRawUnsafe('PRAGMA journal_mode = MEMORY');
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');

    await seedDatabase(prisma, { seedDir: sourceSeedDir });

    const initialSnapshot = await getSnapshot(prisma);

    assert.deepEqual(initialSnapshot.companies, [
      'cmp_00000000-0000-0000-0000-000000000001',
      'cmp_00000000-0000-0000-0000-000000000002',
      'cmp_00000000-0000-0000-0000-000000000003',
    ]);
    assert.deepEqual(initialSnapshot.assessments, [
      'asm_00000000-0000-0000-0000-000000000001',
      'asm_00000000-0000-0000-0000-000000000002',
      'asm_00000000-0000-0000-0000-000000000003',
      'asm_00000000-0000-0000-0000-000000000004',
      'asm_00000000-0000-0000-0000-000000000005',
      'asm_00000000-0000-0000-0000-000000000006',
    ]);
    assert.deepEqual(initialSnapshot.threats, [
      'thr_00000000-0000-0000-0000-000000000001',
      'thr_00000000-0000-0000-0000-000000000002',
      'thr_00000000-0000-0000-0000-000000000003',
      'thr_00000000-0000-0000-0000-000000000004',
    ]);
    assert.deepEqual(initialSnapshot.evidence, [
      'evd_00000000-0000-0000-0000-000000000001',
      'evd_00000000-0000-0000-0000-000000000002',
      'evd_00000000-0000-0000-0000-000000000003',
    ]);
    assert.deepEqual(initialSnapshot.reports, [
      'rpt_00000000-0000-0000-0000-000000000001',
    ]);
    assert.deepEqual(initialSnapshot.activities, [
      'act_00000000-0000-0000-0000-000000000001',
      'act_00000000-0000-0000-0000-000000000002',
      'act_00000000-0000-0000-0000-000000000003',
      'act_00000000-0000-0000-0000-000000000004',
    ]);
    assert.deepEqual(initialSnapshot.settings, [
      'set_00000000-0000-0000-0000-000000000001',
    ]);
    assert.deepEqual(initialSnapshot.reportThreatIds, [
      'thr_00000000-0000-0000-0000-000000000001',
      'thr_00000000-0000-0000-0000-000000000002',
    ]);
    assert.deepEqual(initialSnapshot.evidenceThreatIds, [
      'thr_00000000-0000-0000-0000-000000000001',
      'thr_00000000-0000-0000-0000-000000000002',
    ]);
    assert.equal(initialSnapshot.reportThreats.length, 2);
    assert.equal(initialSnapshot.evidenceThreats.length, 4);

    runNpmScript(['run', 'db:reset']);

    const resetSnapshot = await getSnapshot(prisma);
    assert.deepEqual(resetSnapshot, initialSnapshot);

    const invalidSeedDir = path.join(tempDir, 'invalid-seed');
    await cp(sourceSeedDir, invalidSeedDir, { recursive: true });
    await writeFile(
      path.join(invalidSeedDir, 'companies.json'),
      JSON.stringify([
        {
          id: 'cmp_00000000-0000-0000-0000-000000000001',
          name: '',
          createdAt: 'bad-date',
          updatedAt: '2026-06-11T09:00:00.000Z',
        },
      ]),
      'utf8',
    );

    await assert.rejects(
      seedDatabase(prisma, { seedDir: invalidSeedDir }),
      (error: unknown) => {
        assert.ok(error instanceof SeedInputError);
        assert.equal(error.filePath.endsWith('companies.json'), true);
        assert.ok(
          error.message.includes('record 0 field name') ||
            error.message.includes('field name'),
          'Expected the error message to point to the invalid field.',
        );
        assert.ok(
          error.message.includes('companies.json'),
          'Expected the file name to appear in the error message.',
        );

        return true;
      },
    );

    const postFailureSnapshot = await getSnapshot(prisma);
    assert.deepEqual(postFailureSnapshot, resetSnapshot);
  } finally {
    await prisma.$disconnect();
  }
} finally {
  await rm(tempDir, { recursive: true, force: true });
}

console.log('seed workflow checks passed');

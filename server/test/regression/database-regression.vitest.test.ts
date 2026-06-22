import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

import { afterAll, beforeAll, describe, it } from 'vitest';

const repositoryRoot = process.cwd();
const buildDirectory = path.join(
  repositoryRoot,
  '.tmp',
  `vitest-database-${process.pid}-${Date.now()}`,
);

const previousBuildDirectory = process.env.APPSEC_BUILD_DIR;
const previousDatabaseUrl = process.env.DATABASE_URL;

beforeAll(async () => {
  const generatedDirectory = path.join(buildDirectory, 'generated');

  await mkdir(generatedDirectory, { recursive: true });
  await cp(
    path.join(repositoryRoot, 'generated', 'prisma'),
    path.join(generatedDirectory, 'prisma'),
    { recursive: true },
  );

  process.env.APPSEC_BUILD_DIR = buildDirectory;
  process.env.DATABASE_URL = `file:${path
    .join(buildDirectory, 'database.sqlite')
    .replaceAll('\\', '/')}`;
});

afterAll(async () => {
  if (previousBuildDirectory === undefined) {
    delete process.env.APPSEC_BUILD_DIR;
  } else {
    process.env.APPSEC_BUILD_DIR = previousBuildDirectory;
  }

  if (previousDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = previousDatabaseUrl;
  }

  await rm(buildDirectory, {
    recursive: true,
    force: true,
  });
});

describe.sequential('database regression coverage', () => {
  it('server/database/errors.test.ts', async () => {
    await import('../../database/errors.test.js');
  });

  it('server/database/repositories/repositories.test.ts', async () => {
    await import('../../database/repositories/repositories.test.js');
  });

  it('server/database/repositories/repositories.test.company-assessment-threat.ts', async () => {
    await import('../../database/repositories/repositories.test.company-assessment-threat.js');
  });

  it('server/database/repositories/company.repository.test.ts', async () => {
    await import('../../database/repositories/company.repository.test.js');
  });

  it('server/database/repositories/repositories.test.evidence-report-settings.ts', async () => {
    await import('../../database/repositories/repositories.test.evidence-report-settings.js');
  });

  it('server/database/repositories/repositories.test.report-version.ts', async () => {
    await import('../../database/repositories/repositories.test.report-version.js');
  });

  it('server/database/repositories/repositories.integration.test.ts', async () => {
    await import('../../database/repositories/repositories.integration.test.js');
  }, 180_000);

  it('server/database/repositories/repositories.integration.report-version.test.ts', async () => {
    await import('../../database/repositories/repositories.integration.report-version.test.js');
  }, 180_000);

  it('server/database/seed.test.ts', async () => {
    await import('../../database/seed.test.js');
  }, 300_000);
});

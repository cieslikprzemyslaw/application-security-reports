import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { ZodTypeAny } from 'zod';

import type {
  Activity,
  Assessment,
  Company,
  Evidence,
  Report,
  Settings,
  Threat,
} from '../src/domain/index.js';
import {
  activityFileSchema,
  assessmentsFileSchema,
  companiesFileSchema,
  evidenceFileSchema,
  reportsFileSchema,
  settingsFileSchema,
  threatsFileSchema,
} from '../src/domain/schemas/index.js';
import { parseJsonData } from '../src/validation/index.js';

import type {
  RepositoryClient,
  RepositoryTransactionClient,
} from '../server/database/repository.types.js';
import { dedupeStrings } from '../server/database/repositories/repository.helpers.js';
import { prisma } from '../server/lib/prisma.js';

type SeedCollections = {
  companies: Company[];
  assessments: Assessment[];
  threats: Threat[];
  evidence: Evidence[];
  reports: Report[];
  activities: Activity[];
  settings: Settings;
};

type SeedFileDefinition<TSchema extends ZodTypeAny> = {
  fileName: string;
  schema: TSchema;
};

export interface SeedFileIssue {
  path: string;
  message: string;
  record?: number;
  field?: string;
}

export class SeedInputError extends Error {
  public readonly filePath: string;

  public readonly issues: SeedFileIssue[];

  constructor(filePath: string, issues: SeedFileIssue[], cause?: Error) {
    super(formatSeedInputError(filePath, issues), { cause });
    this.name = 'SeedInputError';
    this.filePath = filePath;
    this.issues = issues;
  }
}

const seedRootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const defaultSeedDir = path.join(seedRootDir, 'seed');

const seedFileDefinitions = {
  companies: {
    fileName: 'companies.json',
    schema: companiesFileSchema,
  },
  assessments: {
    fileName: 'assessments.json',
    schema: assessmentsFileSchema,
  },
  threats: {
    fileName: 'threats.json',
    schema: threatsFileSchema,
  },
  evidence: {
    fileName: 'evidence.json',
    schema: evidenceFileSchema,
  },
  reports: {
    fileName: 'reports.json',
    schema: reportsFileSchema,
  },
  activities: {
    fileName: 'activities.json',
    schema: activityFileSchema,
  },
  settings: {
    fileName: 'settings.json',
    schema: settingsFileSchema,
  },
} as const satisfies Record<string, SeedFileDefinition<ZodTypeAny>>;

const seedFileEntries = Object.entries(seedFileDefinitions) as Array<
  [keyof SeedCollections, SeedFileDefinition<ZodTypeAny>]
>;

const stripUndefined = <T extends Record<string, unknown>>(value: T): T => {
  const entries = Object.entries(value).filter(
    ([, entry]) => entry !== undefined,
  );

  return Object.fromEntries(entries) as T;
};

const formatSeedInputError = (filePath: string, issues: SeedFileIssue[]) => {
  const issueLines = issues.map(issue => {
    const location =
      issue.record !== undefined
        ? `record ${issue.record}${issue.field ? ` field ${issue.field}` : ''}`
        : issue.field
          ? `field ${issue.field}`
          : 'file';

    return `- ${location}: ${issue.message}`;
  });

  return [`Invalid seed file ${filePath}:`, ...issueLines].join('\n');
};

const formatValidationPath = (pathValue: string) => {
  if (pathValue.length === 0) {
    return {};
  }

  const segments = pathValue.split('.');
  const firstNumericSegmentIndex = segments.findIndex(segment =>
    /^\d+$/.test(segment),
  );

  if (firstNumericSegmentIndex === -1) {
    return {
      field: pathValue,
    };
  }

  const record = Number(segments[firstNumericSegmentIndex]);
  const field = segments.slice(firstNumericSegmentIndex + 1).join('.');

  return {
    record,
    field: field.length > 0 ? field : undefined,
  };
};

const wrapSeedError = (filePath: string, error: unknown) => {
  if (error instanceof SeedInputError) {
    return error;
  }

  if (error instanceof Error && 'response' in error) {
    const response = error as {
      response?: {
        fields?: Array<{ path: string; message: string }>;
      };
    };
    const fields = response.response?.fields ?? [];

    if (fields.length > 0) {
      return new SeedInputError(
        filePath,
        fields.map(field => {
          const location = formatValidationPath(field.path);

          return {
            path: field.path,
            message: field.message,
            ...location,
          };
        }),
        error,
      );
    }
  }

  if (error instanceof Error) {
    return new SeedInputError(
      filePath,
      [
        {
          path: '',
          message: error.message,
        },
      ],
      error,
    );
  }

  return new SeedInputError(
    filePath,
    [
      {
        path: '',
        message: String(error),
      },
    ],
    error instanceof Error ? error : undefined,
  );
};

const readSeedCollection = async <TSchema extends ZodTypeAny>(
  seedDir: string,
  definition: SeedFileDefinition<TSchema>,
): Promise<import('zod').output<TSchema>> => {
  const filePath = path.join(seedDir, definition.fileName);

  try {
    const rawFile = await fs.readFile(filePath, 'utf8');

    return parseJsonData(rawFile, definition.schema);
  } catch (error) {
    throw wrapSeedError(filePath, error);
  }
};

export const loadSeedInput = async (
  seedDir = defaultSeedDir,
): Promise<SeedCollections> => {
  const loadedEntries = await Promise.all(
    seedFileEntries.map(async ([key, definition]) => [
      key,
      await readSeedCollection(seedDir, definition),
    ]),
  );

  return Object.fromEntries(loadedEntries) as SeedCollections;
};

const clearSeedData = async (db: RepositoryTransactionClient) => {
  await db.reportThreat.deleteMany({});
  await db.evidenceThreat.deleteMany({});
  await db.report.deleteMany({});
  await db.evidence.deleteMany({});
  await db.threat.deleteMany({});
  await db.assessment.deleteMany({});
  await db.activity.deleteMany({});
  await db.settings.deleteMany({});
  await db.company.deleteMany({});
};

const insertCompanies = async (
  db: RepositoryTransactionClient,
  rows: Company[],
) => {
  for (const row of rows) {
    await db.company.create({
      data: stripUndefined({
        ...row,
      }),
    });
  }
};

const insertAssessments = async (
  db: RepositoryTransactionClient,
  rows: Assessment[],
) => {
  for (const row of rows) {
    await db.assessment.create({
      data: stripUndefined({
        ...row,
      }),
    });
  }
};

const insertThreats = async (
  db: RepositoryTransactionClient,
  rows: Threat[],
) => {
  for (const row of rows) {
    await db.threat.create({
      data: stripUndefined({
        ...row,
      }),
    });
  }
};

const insertEvidence = async (
  db: RepositoryTransactionClient,
  rows: Evidence[],
) => {
  for (const row of rows) {
    const { threatIds, ...evidence } = row;

    await db.evidence.create({
      data: stripUndefined({
        ...evidence,
      }),
    });

    const uniqueThreatIds = dedupeStrings(threatIds);

    for (const threatId of uniqueThreatIds) {
      await db.evidenceThreat.create({
        data: {
          evidenceId: row.id,
          threatId,
        },
      });
    }
  }
};

const insertReports = async (
  db: RepositoryTransactionClient,
  rows: Report[],
) => {
  for (const row of rows) {
    const { selectedThreatIds, ...report } = row;

    await db.report.create({
      data: stripUndefined({
        ...report,
      }),
    });

    const uniqueThreatIds = dedupeStrings(selectedThreatIds);

    for (const threatId of uniqueThreatIds) {
      await db.reportThreat.create({
        data: {
          reportId: row.id,
          threatId,
        },
      });
    }
  }
};

const insertActivities = async (
  db: RepositoryTransactionClient,
  rows: Activity[],
) => {
  for (const row of rows) {
    await db.activity.create({
      data: stripUndefined({
        ...row,
      }),
    });
  }
};

const insertSettings = async (
  db: RepositoryTransactionClient,
  row: Settings,
) => {
  await db.settings.create({
    data: stripUndefined({
      ...row,
    }),
  });
};

export const seedDatabase = async (
  db: RepositoryClient,
  options?: {
    seedDir?: string;
  },
) => {
  const seedInput = await loadSeedInput(options?.seedDir);

  await db.$transaction(async (tx: RepositoryTransactionClient) => {
    await clearSeedData(tx);
    await insertCompanies(tx, seedInput.companies);
    await insertAssessments(tx, seedInput.assessments);
    await insertThreats(tx, seedInput.threats);
    await insertEvidence(tx, seedInput.evidence);
    await insertReports(tx, seedInput.reports);
    await insertActivities(tx, seedInput.activities);
    await insertSettings(tx, seedInput.settings);
  });
};

const main = async () => {
  await seedDatabase(prisma);
  console.log('Database seeded.');
};

const invokedDirectly =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

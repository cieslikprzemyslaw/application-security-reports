import type {
  Activity,
  Assessment,
  Company,
  Evidence,
  Report,
  Settings,
  Threat,
} from '../src/domain/index.js';
import type { RepositoryTransactionClient } from '../server/database/repository.types.js';
import { dedupeStrings } from '../server/database/repositories/repository.helpers.js';

export type SeedCollections = {
  companies: Company[];
  assessments: Assessment[];
  threats: Threat[];
  evidence: Evidence[];
  reports: Report[];
  activities: Activity[];
  settings: Settings;
};

const stripUndefined = <T extends Record<string, unknown>>(value: T): T => {
  const entries = Object.entries(value).filter(
    ([, entry]) => entry !== undefined,
  );

  return Object.fromEntries(entries) as T;
};

const toStoredHttpRequest = (
  request: NonNullable<Evidence['httpExchanges']>[number]['request'],
) => ({
  method: request.method,
  url: request.url,
  ...(request.headers
    ? {
        headers: { ...request.headers },
      }
    : {}),
  ...(request.body !== undefined ? { body: request.body } : {}),
});

const toStoredHttpResponse = (
  response: NonNullable<Evidence['httpExchanges']>[number]['response'],
) => ({
  statusCode: response.statusCode,
  ...(response.statusText !== undefined
    ? { statusText: response.statusText }
    : {}),
  ...(response.headers
    ? {
        headers: { ...response.headers },
      }
    : {}),
  ...(response.body !== undefined ? { body: response.body } : {}),
});

const clearSeedData = async (db: RepositoryTransactionClient) => {
  await db.reportThreat.deleteMany({});
  await db.evidenceExchange.deleteMany({});
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
    const { threatIds, httpExchanges, ...evidence } = row;

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

    for (const [position, exchange] of (httpExchanges ?? []).entries()) {
      await db.evidenceExchange.create({
        data: {
          id: `${row.id}-${position}`,
          evidenceId: row.id,
          position,
          request: toStoredHttpRequest(exchange.request),
          response: toStoredHttpResponse(exchange.response),
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

    for (const [position, threatId] of uniqueThreatIds.entries()) {
      await db.reportThreat.create({
        data: {
          reportId: row.id,
          threatId,
          position,
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

export const persistSeedCollections = async (
  db: RepositoryTransactionClient,
  collections: SeedCollections,
) => {
  await clearSeedData(db);
  await insertCompanies(db, collections.companies);
  await insertAssessments(db, collections.assessments);
  await insertThreats(db, collections.threats);
  await insertEvidence(db, collections.evidence);
  await insertReports(db, collections.reports);
  await insertActivities(db, collections.activities);
  await insertSettings(db, collections.settings);
};

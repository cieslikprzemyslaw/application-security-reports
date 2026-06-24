import type { ReportVersion } from '../../../src/domain/report.js';
import type { CreateReportVersionInput } from '../../../src/domain/report.js';
import type { ReportVersionStatus } from '../../../src/domain/common.js';
import { reportSnapshotSchema } from '../../../src/domain/schemas/report.schema.js';
import {
  ValidationError,
  formatValidationErrors,
} from '../../../src/validation/index.js';
import { generateId } from '../../utils/id.js';
import { mapPrismaError, RepositoryError } from '../errors.js';
import type {
  RepositoryClient,
  RepositoryTransactionClient,
} from '../repository.types.js';
import { toOptionalText } from './repository.helpers.js';

export interface ReportVersionTransactionRepository {
  create(input: CreateReportVersionInput): Promise<ReportVersion>;
  findById(id: string): Promise<ReportVersion | null>;
  findByReportId(reportId: string): Promise<ReportVersion[]>;
}

export interface ReportVersionRepository extends ReportVersionTransactionRepository {
  withTransaction<T>(
    operation: (repository: ReportVersionTransactionRepository) => Promise<T>,
  ): Promise<T>;
}

type ReportVersionRepositoryDb = Pick<
  RepositoryClient,
  'reportVersion' | '$transaction'
>;

type ReportVersionTransactionDb = Pick<
  RepositoryTransactionClient,
  'reportVersion'
>;

class ReportVersionTransactionOperationError extends Error {
  constructor(readonly operationError: unknown) {
    super('ReportVersion transaction operation failed.');
    this.name = 'ReportVersionTransactionOperationError';
  }
}

type ReportVersionRow = {
  id: string;
  reportId: string;
  version: number;
  status: string;
  generatedAt: string;
  filePath: string | null;
  snapshot: unknown;
};

const reportVersionSelect = {
  id: true,
  reportId: true,
  version: true,
  status: true,
  generatedAt: true,
  filePath: true,
  snapshot: true,
} as const;

const toReportVersion = (row: ReportVersionRow): ReportVersion => {
  const snapshotResult = reportSnapshotSchema.safeParse(row.snapshot);

  if (!snapshotResult.success) {
    throw new RepositoryError('Stored snapshot data is invalid.');
  }

  return {
    id: row.id,
    reportId: row.reportId,
    version: row.version,
    status: row.status as ReportVersionStatus,
    generatedAt: row.generatedAt,
    filePath: toOptionalText(row.filePath),
    snapshot: snapshotResult.data,
  };
};

const createTransactionRepository = (
  db: ReportVersionTransactionDb,
): ReportVersionTransactionRepository => ({
  async create(input) {
    const snapshotResult = reportSnapshotSchema.safeParse(input.snapshot);

    if (!snapshotResult.success) {
      throw new ValidationError(formatValidationErrors(snapshotResult.error));
    }

    try {
      const row = await db.reportVersion.create({
        data: {
          id: generateId('reportVersion'),
          reportId: input.reportId,
          version: input.version,
          status: input.status,
          generatedAt: input.generatedAt,
          filePath: input.filePath ?? null,
          snapshot: snapshotResult.data,
        },
        select: reportVersionSelect,
      });

      return toReportVersion(row);
    } catch (error) {
      throw mapPrismaError(error);
    }
  },

  async findById(id) {
    const row = await db.reportVersion.findUnique({
      where: { id },
      select: reportVersionSelect,
    });

    return row ? toReportVersion(row) : null;
  },

  async findByReportId(reportId) {
    const rows = await db.reportVersion.findMany({
      where: { reportId },
      orderBy: [{ createdAt: 'asc' }, { version: 'asc' }],
      select: reportVersionSelect,
    });

    return rows.map(toReportVersion);
  },
});

export function createReportVersionRepository(
  db: ReportVersionRepositoryDb,
): ReportVersionRepository {
  return {
    ...createTransactionRepository(db),

    async withTransaction(operation) {
      try {
        return await db.$transaction(
          async (tx: RepositoryTransactionClient) => {
            try {
              return await operation(createTransactionRepository(tx));
            } catch (error) {
              throw new ReportVersionTransactionOperationError(error);
            }
          },
        );
      } catch (error) {
        if (error instanceof ReportVersionTransactionOperationError) {
          throw error.operationError;
        }

        throw mapPrismaError(error);
      }
    },
  };
}

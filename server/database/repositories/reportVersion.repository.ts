import type { ReportVersion } from '../../../src/domain/report.js';
import type { CreateReportVersionInput } from '../../../src/domain/report.js';
import type {
  ReportStatus,
  ReportVersionStatus,
} from '../../../src/domain/common.js';
import { reportVersionSnapshotSchema } from '../../../src/domain/schemas/report.schema.js';
import {
  ValidationError,
  formatValidationErrors,
} from '../../../src/validation/index.js';
import { generateId } from '../../utils/id.js';
import {
  mapPrismaError,
  RepositoryConflictError,
  RepositoryError,
} from '../errors.js';
import type {
  RepositoryClient,
  RepositoryTransactionClient,
} from '../repository.types.js';
import type { AssessmentRepository } from './assessment.repository.js';
import { createAssessmentRepository } from './assessment.repository.js';
import type { CompanyRepository } from './company.repository.js';
import { createCompanyRepository } from './company.repository.js';
import type { EvidenceLookupRepository } from './evidence.repository.js';
import { createEvidenceLookupRepository } from './evidence.repository.js';
import type { ReportLookupRepository } from './report.repository.js';
import { createReportLookupRepository } from './report.repository.js';
import { toOptionalText } from './repository.helpers.js';
import type { SettingsRepository } from './settings.repository.js';
import { createSettingsRepository } from './settings.repository.js';
import type { ThreatRepository } from './threat.repository.js';
import { createThreatRepository } from './threat.repository.js';

export interface ReportVersionTransactionRepository {
  create(input: CreateReportVersionInput): Promise<ReportVersion>;
  findById(id: string): Promise<ReportVersion | null>;
  findByReportId(reportId: string): Promise<ReportVersion[]>;
  applyRetention(reportId: string, currentVersion: number): Promise<void>;
  updateReportLatestVersion(
    reportId: string,
    version: number,
    status?: ReportStatus,
  ): Promise<void>;
  updateReportLatestVersionIfCurrent(
    reportId: string,
    expectedLatestVersion: number,
    version: number,
    status?: ReportStatus,
  ): Promise<void>;
}

export interface DeleteReportVersionResult {
  deletedVersion: ReportVersion;
  latestVersion: number;
  latestStatus: ReportStatus;
}

export interface ReportVersionFinalisationTransactionRepositories {
  assessmentRepository: Pick<AssessmentRepository, 'findById'>;
  companyRepository: Pick<CompanyRepository, 'findById'>;
  evidenceRepository: EvidenceLookupRepository;
  reportRepository: ReportLookupRepository;
  reportVersionRepository: ReportVersionTransactionRepository;
  settingsRepository: Pick<SettingsRepository, 'get'>;
  threatRepository: Pick<ThreatRepository, 'findById'>;
}

export interface ReportVersionRepository extends ReportVersionTransactionRepository {
  deleteByReportIdAndVersionId(
    reportId: string,
    versionId: string,
  ): Promise<DeleteReportVersionResult | null>;
  withTransaction<T>(
    operation: (repository: ReportVersionTransactionRepository) => Promise<T>,
  ): Promise<T>;
  withFinalisationTransaction<T>(
    operation: (
      repositories: ReportVersionFinalisationTransactionRepositories,
    ) => Promise<T>,
  ): Promise<T>;
}

type ReportVersionRepositoryDb = Pick<
  RepositoryClient,
  'report' | 'reportVersion' | '$transaction'
>;

type ReportVersionTransactionDb = Pick<
  RepositoryTransactionClient,
  'report' | 'reportVersion'
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
  const snapshotResult = reportVersionSnapshotSchema.safeParse(row.snapshot);

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

const statusFromVersion = (
  version: Pick<ReportVersionRow, 'status'> | null,
): ReportStatus => (version?.status === 'final' ? 'generated' : 'draft');

const updateReportLatestVersionData = (
  version: number,
  status?: ReportStatus,
) => ({
  latestVersion: version,
  ...(status ? { status } : {}),
});

const createTransactionRepository = (
  db: ReportVersionTransactionDb,
): ReportVersionTransactionRepository => ({
  async create(input) {
    const snapshotResult = reportVersionSnapshotSchema.safeParse(
      input.snapshot,
    );

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
      orderBy: [{ version: 'asc' }, { createdAt: 'asc' }],
      select: reportVersionSelect,
    });

    return rows.map(toReportVersion);
  },

  async applyRetention(_reportId, _currentVersion) {
    // Manual delete is now the only supported way to remove saved versions.
    // Automatic retention must not delete drafts or finals behind the user's back.
    return;
  },

  async updateReportLatestVersion(reportId, version, status) {
    try {
      await db.report.update({
        where: { id: reportId },
        data: updateReportLatestVersionData(version, status),
      });
    } catch (error) {
      throw mapPrismaError(error);
    }
  },

  async updateReportLatestVersionIfCurrent(
    reportId,
    expectedLatestVersion,
    version,
    status,
  ) {
    try {
      const result = await db.report.updateMany({
        where: { id: reportId, latestVersion: expectedLatestVersion },
        data: updateReportLatestVersionData(version, status),
      });

      if (result.count !== 1) {
        throw new RepositoryConflictError(
          'Report version changed before finalisation completed.',
        );
      }
    } catch (error) {
      throw mapPrismaError(error);
    }
  },
});

const createFinalisationTransactionRepositories = (
  db: RepositoryTransactionClient,
): ReportVersionFinalisationTransactionRepositories => ({
  assessmentRepository: createAssessmentRepository(db),
  companyRepository: createCompanyRepository(db),
  evidenceRepository: createEvidenceLookupRepository(db),
  reportRepository: createReportLookupRepository(db),
  reportVersionRepository: createTransactionRepository(db),
  settingsRepository: createSettingsRepository(db),
  threatRepository: createThreatRepository(db),
});

const runTransaction = async <T>(
  db: ReportVersionRepositoryDb,
  operation: (transaction: RepositoryTransactionClient) => Promise<T>,
): Promise<T> => {
  try {
    return await db.$transaction(async (tx: RepositoryTransactionClient) => {
      try {
        return await operation(tx);
      } catch (error) {
        throw new ReportVersionTransactionOperationError(error);
      }
    });
  } catch (error) {
    if (error instanceof ReportVersionTransactionOperationError) {
      throw error.operationError;
    }

    throw mapPrismaError(error);
  }
};

export function createReportVersionRepository(
  db: ReportVersionRepositoryDb,
): ReportVersionRepository {
  return {
    ...createTransactionRepository(db),

    async deleteByReportIdAndVersionId(reportId, versionId) {
      return runTransaction(db, async transaction => {
        const existingVersion = await transaction.reportVersion.findUnique({
          where: { id: versionId, reportId },
          select: reportVersionSelect,
        });

        if (!existingVersion) {
          return null;
        }

        await transaction.reportVersion.delete({
          where: { id: versionId, reportId },
        });

        const latestRemainingVersion =
          await transaction.reportVersion.findFirst({
            where: { reportId },
            orderBy: [{ version: 'desc' }, { createdAt: 'desc' }],
            select: {
              version: true,
              status: true,
            },
          });

        const latestVersion = latestRemainingVersion?.version ?? 0;
        const latestStatus = statusFromVersion(latestRemainingVersion);

        await transaction.report.update({
          where: { id: reportId },
          data: {
            latestVersion,
            status: latestStatus,
          },
        });

        return {
          deletedVersion: toReportVersion(existingVersion),
          latestVersion,
          latestStatus,
        };
      });
    },

    async withTransaction(operation) {
      return runTransaction(db, transaction =>
        operation(createTransactionRepository(transaction)),
      );
    },

    async withFinalisationTransaction(operation) {
      return runTransaction(db, transaction =>
        operation(createFinalisationTransactionRepositories(transaction)),
      );
    },
  };
}

import type { ReportVersion } from '../../src/domain/report.js';
import type { ReportVersionStatus } from '../../src/domain/common.js';
import type {
  ReportVersionRepository,
  ReportVersionTransactionRepository,
} from '../database/repositories/reportVersion.repository.js';

const VERSION_SCALE = 10;
const MAX_DRAFT_MINOR = VERSION_SCALE - 1;

interface ReportVersionHistoryState {
  currentFinalMajor: number;
  currentDraftMinor: number;
}

export interface ReportVersionNumberingRepository {
  findByReportId: Pick<
    ReportVersionTransactionRepository,
    'findByReportId'
  >['findByReportId'];
}

export interface TransactionalReportVersionNumberingRepository {
  withTransaction: Pick<
    ReportVersionRepository,
    'withTransaction'
  >['withTransaction'];
}

export interface ReportVersionNumberingTransactionContext {
  version: number;
  repository: ReportVersionTransactionRepository;
}

export class ReportVersionHistoryError extends Error {
  constructor(message = 'Report version history is inconsistent.') {
    super(message);
    this.name = 'ReportVersionHistoryError';
  }
}

export class ReportVersionSequenceExhaustedError extends Error {
  constructor(
    message = 'Report version history has exhausted the supported draft sequence.',
  ) {
    super(message);
    this.name = 'ReportVersionSequenceExhaustedError';
  }
}

const failInvalidHistory = (): never => {
  throw new ReportVersionHistoryError();
};

const requireSupportedVersion = (version: ReportVersion): void => {
  if (!Number.isSafeInteger(version.version) || version.version <= 0) {
    failInvalidHistory();
  }

  const major = Math.floor(version.version / VERSION_SCALE);
  const minor = version.version % VERSION_SCALE;

  if (version.status === 'draft') {
    if (minor === 0) {
      failInvalidHistory();
    }

    return;
  }

  if (version.status === 'final') {
    if (major === 0 || minor !== 0) {
      failInvalidHistory();
    }

    return;
  }

  failInvalidHistory();
};

const analyseReportVersionHistory = (
  history: readonly ReportVersion[],
): ReportVersionHistoryState => {
  let currentFinalMajor = 0;
  let currentDraftMinor = 0;

  for (const version of history) {
    requireSupportedVersion(version);

    if (version.status === 'draft') {
      const expectedDraft =
        currentFinalMajor * VERSION_SCALE + currentDraftMinor + 1;

      if (version.version !== expectedDraft) {
        failInvalidHistory();
      }

      currentDraftMinor += 1;
      continue;
    }

    const expectedFinal = (currentFinalMajor + 1) * VERSION_SCALE;

    if (version.version !== expectedFinal) {
      failInvalidHistory();
    }

    currentFinalMajor += 1;
    currentDraftMinor = 0;
  }

  return { currentFinalMajor, currentDraftMinor };
};

export const calculateNextDraftReportVersionNumber = (
  history: readonly ReportVersion[],
): number => {
  const { currentFinalMajor, currentDraftMinor } =
    analyseReportVersionHistory(history);

  if (currentDraftMinor >= MAX_DRAFT_MINOR) {
    throw new ReportVersionSequenceExhaustedError();
  }

  return currentFinalMajor * VERSION_SCALE + currentDraftMinor + 1;
};

export const calculateNextFinalReportVersionNumber = (
  history: readonly ReportVersion[],
): number => {
  const { currentFinalMajor } = analyseReportVersionHistory(history);

  return (currentFinalMajor + 1) * VERSION_SCALE;
};

const calculateNextReportVersionNumber = (
  status: ReportVersionStatus,
  history: readonly ReportVersion[],
): number =>
  status === 'draft'
    ? calculateNextDraftReportVersionNumber(history)
    : calculateNextFinalReportVersionNumber(history);

export const getNextReportVersionNumber = async (
  reportId: string,
  status: ReportVersionStatus,
  repository: ReportVersionNumberingRepository,
): Promise<number> => {
  const history = await repository.findByReportId(reportId);

  if (history.some(version => version.reportId !== reportId)) {
    failInvalidHistory();
  }

  return calculateNextReportVersionNumber(status, history);
};

export const withNextReportVersionNumber = async <T>(
  reportId: string,
  status: ReportVersionStatus,
  repository: TransactionalReportVersionNumberingRepository,
  operation: (context: ReportVersionNumberingTransactionContext) => Promise<T>,
): Promise<T> =>
  repository.withTransaction(async transactionRepository => {
    const version = await getNextReportVersionNumber(
      reportId,
      status,
      transactionRepository,
    );

    return operation({ version, repository: transactionRepository });
  });

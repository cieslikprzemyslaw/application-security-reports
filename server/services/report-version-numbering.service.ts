import type { ReportVersion } from '../../src/domain/report.js';
import type { ReportVersionStatus } from '../../src/domain/common.js';
import type {
  ReportVersionRepository,
  ReportVersionTransactionRepository,
} from '../database/repositories/reportVersion.repository.js';

const VERSION_SCALE = 10;
const MAX_DRAFT_MINOR = VERSION_SCALE - 1;

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

const getMajor = (version: number): number =>
  Math.floor(version / VERSION_SCALE);
const getMinor = (version: number): number => version % VERSION_SCALE;

const requireSupportedVersion = (version: ReportVersion): void => {
  if (!Number.isSafeInteger(version.version) || version.version <= 0) {
    failInvalidHistory();
  }

  const major = getMajor(version.version);
  const minor = getMinor(version.version);

  if (version.status === 'draft') {
    if (minor === 0 || minor > MAX_DRAFT_MINOR) {
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

const requireSupportedHistory = (history: readonly ReportVersion[]): void => {
  const seenVersions = new Set<number>();

  for (const version of history) {
    requireSupportedVersion(version);

    if (seenVersions.has(version.version)) {
      failInvalidHistory();
    }

    seenVersions.add(version.version);
  }
};

const maxOrZero = (values: readonly number[]): number =>
  values.length === 0 ? 0 : Math.max(...values);

export const calculateNextDraftReportVersionNumber = (
  history: readonly ReportVersion[],
): number => {
  requireSupportedHistory(history);

  if (history.length === 0) {
    return 1;
  }

  const latestFinalMajor = maxOrZero(
    history
      .filter(version => version.status === 'final')
      .map(version => getMajor(version.version)),
  );
  const latestDraftMajor = maxOrZero(
    history
      .filter(version => version.status === 'draft')
      .map(version => getMajor(version.version)),
  );
  const activeMajor = Math.max(latestFinalMajor, latestDraftMajor);
  const latestDraftMinorInActiveMajor = maxOrZero(
    history
      .filter(
        version =>
          version.status === 'draft' &&
          getMajor(version.version) === activeMajor,
      )
      .map(version => getMinor(version.version)),
  );

  if (latestDraftMinorInActiveMajor >= MAX_DRAFT_MINOR) {
    throw new ReportVersionSequenceExhaustedError();
  }

  return activeMajor * VERSION_SCALE + latestDraftMinorInActiveMajor + 1;
};

export const calculateNextFinalReportVersionNumber = (
  history: readonly ReportVersion[],
): number => {
  requireSupportedHistory(history);

  const latestFinalMajor = maxOrZero(
    history
      .filter(version => version.status === 'final')
      .map(version => getMajor(version.version)),
  );

  return (latestFinalMajor + 1) * VERSION_SCALE;
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

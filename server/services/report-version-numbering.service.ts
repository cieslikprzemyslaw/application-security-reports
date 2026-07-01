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

const toVersionParts = (version: number): { major: number; minor: number } => ({
  major: Math.floor(version / VERSION_SCALE),
  minor: version % VERSION_SCALE,
});

const compareVersions = (left: ReportVersion, right: ReportVersion): number =>
  left.version - right.version;

const requireUniqueVersionNumbers = (
  history: readonly ReportVersion[],
): void => {
  const seen = new Set<number>();

  for (const version of history) {
    if (seen.has(version.version)) {
      failInvalidHistory();
    }

    seen.add(version.version);
  }
};

const requireSequentialFinalVersions = (
  finals: readonly ReportVersion[],
): number => {
  let expectedMajor = 1;

  for (const version of [...finals].sort(compareVersions)) {
    const { major } = toVersionParts(version.version);

    if (major !== expectedMajor) {
      failInvalidHistory();
    }

    expectedMajor += 1;
  }

  return expectedMajor - 1;
};

const requireDraftContinuityWhenMultipleDraftsAreRetained = (
  drafts: readonly ReportVersion[],
): void => {
  const draftsByMajor = new Map<number, number[]>();

  for (const version of drafts) {
    const { major, minor } = toVersionParts(version.version);
    const minors = draftsByMajor.get(major) ?? [];
    minors.push(minor);
    draftsByMajor.set(major, minors);
  }

  for (const minors of draftsByMajor.values()) {
    if (minors.length <= 1) {
      continue;
    }

    const sorted = [...minors].sort((left, right) => left - right);

    sorted.forEach((minor, index) => {
      if (minor !== index + 1) {
        failInvalidHistory();
      }
    });
  }
};

const analyseReportVersionHistory = (
  history: readonly ReportVersion[],
): ReportVersionHistoryState => {
  if (history.length === 0) {
    return { currentFinalMajor: 0, currentDraftMinor: 0 };
  }

  for (const version of history) {
    requireSupportedVersion(version);
  }

  requireUniqueVersionNumbers(history);

  const draftVersions = history.filter(version => version.status === 'draft');
  const finalMajor = requireSequentialFinalVersions(
    history.filter(version => version.status === 'final'),
  );

  requireDraftContinuityWhenMultipleDraftsAreRetained(draftVersions);

  const current = [...history].sort(compareVersions).at(-1);

  if (!current) {
    return { currentFinalMajor: 0, currentDraftMinor: 0 };
  }

  const { major, minor } = toVersionParts(current.version);

  if (current.status === 'final') {
    return { currentFinalMajor: major, currentDraftMinor: 0 };
  }

  if (major !== finalMajor) {
    failInvalidHistory();
  }

  return { currentFinalMajor: major, currentDraftMinor: minor };
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

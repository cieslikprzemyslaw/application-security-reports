import type { ReportVersion } from '../../src/domain/report.js';
import type { ReportVersionRepository } from '../database/repositories/reportVersion.repository.js';

const VERSION_SCALE = 10;
const MAX_DRAFT_MINOR = VERSION_SCALE - 1;

export interface NextReportVersionNumbers {
  draft: number;
  final: number;
}

export interface ReportVersionNumberingRepository {
  findByReportId: Pick<
    ReportVersionRepository,
    'findByReportId'
  >['findByReportId'];
}

export class ReportVersionHistoryError extends Error {
  constructor(message = 'Report version history is inconsistent.') {
    super(message);
    this.name = 'ReportVersionHistoryError';
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

export const calculateNextReportVersionNumbers = (
  history: readonly ReportVersion[],
): NextReportVersionNumbers => {
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

  if (currentDraftMinor >= MAX_DRAFT_MINOR) {
    throw new ReportVersionHistoryError(
      'Report version history has exhausted the supported draft sequence.',
    );
  }

  return {
    draft: currentFinalMajor * VERSION_SCALE + currentDraftMinor + 1,
    final: (currentFinalMajor + 1) * VERSION_SCALE,
  };
};

export const getNextReportVersionNumbers = async (
  reportId: string,
  repository: ReportVersionNumberingRepository,
): Promise<NextReportVersionNumbers> => {
  const history = await repository.findByReportId(reportId);

  if (history.some(version => version.reportId !== reportId)) {
    failInvalidHistory();
  }

  return calculateNextReportVersionNumbers(history);
};

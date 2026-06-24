import { describe, expect, it, vi } from 'vitest';

import type { ReportVersion } from '../../src/domain/report.js';
import { buildReportPreviewSnapshotFixture } from '../test/report-preview.fixture.js';
import type { ReportVersionTransactionRepository } from '../database/repositories/reportVersion.repository.js';
import {
  calculateNextDraftReportVersionNumber,
  calculateNextFinalReportVersionNumber,
  getNextReportVersionNumber,
  ReportVersionHistoryError,
  ReportVersionSequenceExhaustedError,
  withNextReportVersionNumber,
} from './report-version-numbering.service.js';

const reportId = 'rpt_00000000-0000-0000-0000-000000000001';

const buildVersion = (
  version: number,
  status: ReportVersion['status'],
  overrides: Partial<ReportVersion> = {},
): ReportVersion => ({
  id: `rvs_00000000-0000-0000-0000-${String(version).padStart(12, '0')}`,
  reportId,
  version,
  status,
  generatedAt: '2026-06-24',
  snapshot: buildReportPreviewSnapshotFixture(),
  ...overrides,
});

const approvedHistories = [
  {
    name: 'an empty history',
    history: [],
    draft: 1,
    final: 10,
  },
  {
    name: 'the first draft',
    history: [buildVersion(1, 'draft')],
    draft: 2,
    final: 10,
  },
  {
    name: 'consecutive pre-final drafts',
    history: [buildVersion(1, 'draft'), buildVersion(2, 'draft')],
    draft: 3,
    final: 10,
  },
  {
    name: 'the first final',
    history: [buildVersion(10, 'final')],
    draft: 11,
    final: 20,
  },
  {
    name: 'drafts after the first final',
    history: [
      buildVersion(1, 'draft'),
      buildVersion(2, 'draft'),
      buildVersion(10, 'final'),
      buildVersion(11, 'draft'),
      buildVersion(12, 'draft'),
    ],
    draft: 13,
    final: 20,
  },
  {
    name: 'consecutive final versions',
    history: [buildVersion(10, 'final'), buildVersion(20, 'final')],
    draft: 21,
    final: 30,
  },
  {
    name: 'a draft followed by the next final',
    history: [
      buildVersion(10, 'final'),
      buildVersion(11, 'draft'),
      buildVersion(20, 'final'),
    ],
    draft: 21,
    final: 30,
  },
];

const invalidHistories: Array<{
  name: string;
  history: readonly ReportVersion[];
}> = [
  {
    name: 'a missing draft number',
    history: [buildVersion(1, 'draft'), buildVersion(3, 'draft')],
  },
  {
    name: 'duplicate version numbers',
    history: [buildVersion(1, 'draft'), buildVersion(1, 'draft')],
  },
  {
    name: 'a draft from a major version that has not been finalised',
    history: [buildVersion(11, 'draft')],
  },
  {
    name: 'a final version with a minor component',
    history: [buildVersion(11, 'final')],
  },
  {
    name: 'a draft version with a zero minor component',
    history: [buildVersion(10, 'draft')],
  },
  {
    name: 'a skipped final major version',
    history: [buildVersion(20, 'final')],
  },
  {
    name: 'versions outside creation order',
    history: [buildVersion(10, 'final'), buildVersion(1, 'draft')],
  },
  {
    name: 'a non-positive persisted number',
    history: [buildVersion(0, 'draft')],
  },
  {
    name: 'an unsafe persisted number',
    history: [buildVersion(Number.MAX_SAFE_INTEGER + 1, 'draft')],
  },
];

describe('ReportVersion number calculation', () => {
  it.each(approvedHistories)(
    'calculates the approved draft sequence for $name',
    ({ history, draft }) => {
      expect(calculateNextDraftReportVersionNumber(history)).toBe(draft);
    },
  );

  it.each(approvedHistories)(
    'calculates the approved final sequence for $name',
    ({ history, final }) => {
      expect(calculateNextFinalReportVersionNumber(history)).toBe(final);
    },
  );

  it.each(invalidHistories)(
    'rejects $name for draft numbering',
    ({ history }) => {
      expect(() => calculateNextDraftReportVersionNumber(history)).toThrow(
        ReportVersionHistoryError,
      );
    },
  );

  it.each(invalidHistories)(
    'rejects $name for final numbering',
    ({ history }) => {
      expect(() => calculateNextFinalReportVersionNumber(history)).toThrow(
        ReportVersionHistoryError,
      );
    },
  );

  it('keeps final numbering available when the draft sequence is exhausted', () => {
    const history = Array.from({ length: 9 }, (_, index) =>
      buildVersion(index + 1, 'draft'),
    );

    expect(() => calculateNextDraftReportVersionNumber(history)).toThrow(
      ReportVersionSequenceExhaustedError,
    );
    expect(calculateNextFinalReportVersionNumber(history)).toBe(10);
  });
});

describe('getNextReportVersionNumber', () => {
  it('loads persisted history and calculates the requested number without creating a record', async () => {
    const findByReportId = vi
      .fn()
      .mockResolvedValue([
        buildVersion(1, 'draft'),
        buildVersion(10, 'final'),
        buildVersion(11, 'draft'),
      ]);

    await expect(
      getNextReportVersionNumber(reportId, 'draft', { findByReportId }),
    ).resolves.toBe(12);
    await expect(
      getNextReportVersionNumber(reportId, 'final', { findByReportId }),
    ).resolves.toBe(20);

    expect(findByReportId).toHaveBeenCalledTimes(2);
    expect(findByReportId).toHaveBeenNthCalledWith(1, reportId);
    expect(findByReportId).toHaveBeenNthCalledWith(2, reportId);
  });

  it('rejects persisted rows belonging to another report', async () => {
    const findByReportId = vi.fn().mockResolvedValue([
      buildVersion(1, 'draft', {
        reportId: 'rpt_00000000-0000-0000-0000-000000000002',
      }),
    ]);

    await expect(
      getNextReportVersionNumber(reportId, 'draft', { findByReportId }),
    ).rejects.toBeInstanceOf(ReportVersionHistoryError);
  });

  it('does not cache history between calls', async () => {
    const findByReportId = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([buildVersion(1, 'draft')]);

    await expect(
      getNextReportVersionNumber(reportId, 'draft', { findByReportId }),
    ).resolves.toBe(1);
    await expect(
      getNextReportVersionNumber(reportId, 'draft', { findByReportId }),
    ).resolves.toBe(2);

    expect(findByReportId).toHaveBeenCalledTimes(2);
  });
});

describe('withNextReportVersionNumber', () => {
  it('calculates and executes work with the same transaction-bound repository', async () => {
    const transactionRepository = {
      findByReportId: vi.fn().mockResolvedValue([buildVersion(1, 'draft')]),
      create: vi.fn(),
      findById: vi.fn(),
      updateReportLatestVersion: vi.fn(),
    } satisfies ReportVersionTransactionRepository;
    const transactionStarted = vi.fn();
    const withTransaction = async <T>(
      operation: (repository: ReportVersionTransactionRepository) => Promise<T>,
    ): Promise<T> => {
      transactionStarted();
      return operation(transactionRepository);
    };
    const operation = vi.fn(async ({ version, repository }) => ({
      version,
      repository,
    }));

    await expect(
      withNextReportVersionNumber(
        reportId,
        'draft',
        { withTransaction },
        operation,
      ),
    ).resolves.toEqual({
      version: 2,
      repository: transactionRepository,
    });

    expect(transactionStarted).toHaveBeenCalledOnce();
    expect(transactionRepository.findByReportId).toHaveBeenCalledWith(reportId);
    expect(operation).toHaveBeenCalledOnce();
    expect(transactionRepository.create).not.toHaveBeenCalled();
  });

  it('does not invoke the operation when persisted history is invalid', async () => {
    const transactionRepository = {
      findByReportId: vi
        .fn()
        .mockResolvedValue([
          buildVersion(1, 'draft'),
          buildVersion(3, 'draft'),
        ]),
      create: vi.fn(),
      findById: vi.fn(),
      updateReportLatestVersion: vi.fn(),
    } satisfies ReportVersionTransactionRepository;
    const transactionStarted = vi.fn();
    const withTransaction = async <T>(
      operation: (repository: ReportVersionTransactionRepository) => Promise<T>,
    ): Promise<T> => {
      transactionStarted();
      return operation(transactionRepository);
    };
    const operation = vi.fn();

    await expect(
      withNextReportVersionNumber(
        reportId,
        'draft',
        { withTransaction },
        operation,
      ),
    ).rejects.toBeInstanceOf(ReportVersionHistoryError);

    expect(operation).not.toHaveBeenCalled();
    expect(transactionRepository.create).not.toHaveBeenCalled();
  });
});

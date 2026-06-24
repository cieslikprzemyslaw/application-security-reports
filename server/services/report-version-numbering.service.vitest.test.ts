import { describe, expect, it, vi } from 'vitest';

import type { ReportVersion } from '../../src/domain/report.js';
import {
  calculateNextReportVersionNumbers,
  getNextReportVersionNumbers,
  ReportVersionHistoryError,
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
  snapshot: {
    reportTitle: 'Application Security Assessment',
    companyName: 'Northstar Digital',
    assessmentTitle: 'Customer Services Portal',
    branding: { clientName: 'Northstar Digital' },
    threats: [],
  },
  ...overrides,
});

const expectInvalidHistory = (history: readonly ReportVersion[]) => {
  expect(() => calculateNextReportVersionNumbers(history)).toThrow(
    ReportVersionHistoryError,
  );
};

describe('calculateNextReportVersionNumbers', () => {
  it.each([
    {
      name: 'an empty history',
      history: [],
      expected: { draft: 1, final: 10 },
    },
    {
      name: 'the first draft',
      history: [buildVersion(1, 'draft')],
      expected: { draft: 2, final: 10 },
    },
    {
      name: 'consecutive pre-final drafts',
      history: [buildVersion(1, 'draft'), buildVersion(2, 'draft')],
      expected: { draft: 3, final: 10 },
    },
    {
      name: 'the first final',
      history: [buildVersion(10, 'final')],
      expected: { draft: 11, final: 20 },
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
      expected: { draft: 13, final: 20 },
    },
    {
      name: 'consecutive final versions',
      history: [buildVersion(10, 'final'), buildVersion(20, 'final')],
      expected: { draft: 21, final: 30 },
    },
    {
      name: 'a draft followed by the next final',
      history: [
        buildVersion(10, 'final'),
        buildVersion(11, 'draft'),
        buildVersion(20, 'final'),
      ],
      expected: { draft: 21, final: 30 },
    },
  ])('calculates the approved sequence for $name', ({ history, expected }) => {
    expect(calculateNextReportVersionNumbers(history)).toEqual(expected);
  });

  it('rejects a missing draft number', () => {
    expectInvalidHistory([buildVersion(1, 'draft'), buildVersion(3, 'draft')]);
  });

  it('rejects duplicate version numbers', () => {
    expectInvalidHistory([buildVersion(1, 'draft'), buildVersion(1, 'draft')]);
  });

  it('rejects a draft from a major version that has not been finalised', () => {
    expectInvalidHistory([buildVersion(11, 'draft')]);
  });

  it('rejects a final version with a minor component', () => {
    expectInvalidHistory([buildVersion(11, 'final')]);
  });

  it('rejects a draft version with a zero minor component', () => {
    expectInvalidHistory([buildVersion(10, 'draft')]);
  });

  it('rejects skipped final major versions', () => {
    expectInvalidHistory([buildVersion(20, 'final')]);
  });

  it('rejects histories that are out of creation order', () => {
    expectInvalidHistory([buildVersion(10, 'final'), buildVersion(1, 'draft')]);
  });

  it('rejects non-positive and unsafe persisted numbers', () => {
    expectInvalidHistory([buildVersion(0, 'draft')]);
    expectInvalidHistory([buildVersion(Number.MAX_SAFE_INTEGER + 1, 'draft')]);
  });

  it('fails safely when the one-decimal draft sequence is exhausted', () => {
    const history = Array.from({ length: 9 }, (_, index) =>
      buildVersion(index + 1, 'draft'),
    );

    expect(() => calculateNextReportVersionNumbers(history)).toThrowError(
      'Report version history has exhausted the supported draft sequence.',
    );
  });
});

describe('getNextReportVersionNumbers', () => {
  it('loads persisted history and returns both next numbers without creating a record', async () => {
    const findByReportId = vi
      .fn()
      .mockResolvedValue([
        buildVersion(1, 'draft'),
        buildVersion(10, 'final'),
        buildVersion(11, 'draft'),
      ]);

    await expect(
      getNextReportVersionNumbers(reportId, { findByReportId }),
    ).resolves.toEqual({ draft: 12, final: 20 });

    expect(findByReportId).toHaveBeenCalledOnce();
    expect(findByReportId).toHaveBeenCalledWith(reportId);
  });

  it('rejects persisted rows belonging to another report', async () => {
    const findByReportId = vi.fn().mockResolvedValue([
      buildVersion(1, 'draft', {
        reportId: 'rpt_00000000-0000-0000-0000-000000000002',
      }),
    ]);

    await expect(
      getNextReportVersionNumbers(reportId, { findByReportId }),
    ).rejects.toBeInstanceOf(ReportVersionHistoryError);
  });

  it('does not cache history between calls', async () => {
    const findByReportId = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([buildVersion(1, 'draft')]);

    await expect(
      getNextReportVersionNumbers(reportId, { findByReportId }),
    ).resolves.toEqual({ draft: 1, final: 10 });

    await expect(
      getNextReportVersionNumbers(reportId, { findByReportId }),
    ).resolves.toEqual({ draft: 2, final: 10 });

    expect(findByReportId).toHaveBeenCalledTimes(2);
  });
});

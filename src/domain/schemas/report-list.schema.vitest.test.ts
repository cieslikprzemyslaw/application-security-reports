import { describe, expect, it } from 'vitest';

import {
  assessmentReportListResponseSchema,
  reportListQuerySchema,
} from './report-list.schema';

const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';

const reportListItem = {
  id: 'rpt_00000000-0000-0000-0000-000000000001',
  assessmentId,
  title: 'Customer Portal Security Report',
  status: 'draft' as const,
  selectedThreatIds: [],
  latestVersion: 1,
  createdAt: '2026-06-25T10:00:00.000Z',
  updatedAt: '2026-06-25T11:00:00.000Z',
  versions: [
    {
      id: 'rvs_00000000-0000-0000-0000-000000000001',
      version: 1,
      status: 'draft' as const,
      generatedAt: '2026-06-25',
    },
  ],
};

describe('report list schemas', () => {
  it('parses a strict assessment filter and saved version summaries', () => {
    expect(reportListQuerySchema.parse({ assessmentId })).toEqual({
      assessmentId,
    });
    expect(assessmentReportListResponseSchema.parse([reportListItem])).toEqual([
      reportListItem,
    ]);
  });

  it('rejects unknown fields and malformed version identifiers', () => {
    expect(
      reportListQuerySchema.safeParse({ assessmentId, unexpected: true })
        .success,
    ).toBe(false);
    expect(
      assessmentReportListResponseSchema.safeParse([
        {
          ...reportListItem,
          versions: [{ ...reportListItem.versions[0], id: 'bad-version' }],
        },
      ]).success,
    ).toBe(false);
  });
});

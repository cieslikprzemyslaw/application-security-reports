import { describe, expect, it } from 'vitest';

import { createReportService } from './reportService';

import type { ApiRequestOptions } from './apiClient';
import type { ApiRequestFn } from './serviceHelpers';

const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';

const response = {
  data: [
    {
      id: 'rpt_00000000-0000-0000-0000-000000000001',
      assessmentId,
      title: 'Customer Portal Security Report',
      status: 'draft',
      selectedThreatIds: [],
      latestVersion: 1,
      createdAt: '2026-06-25T10:00:00.000Z',
      updatedAt: '2026-06-25T11:00:00.000Z',
      versions: [
        {
          id: 'rvs_00000000-0000-0000-0000-000000000001',
          version: 1,
          status: 'draft',
          generatedAt: '2026-06-25',
        },
      ],
    },
  ],
};

describe('reportService.listByAssessmentId', () => {
  it('loads and validates reports with saved version summaries', async () => {
    const calls: Array<{ input: RequestInfo | URL; init?: ApiRequestOptions }> =
      [];
    const request: ApiRequestFn = async <T>(
      input: RequestInfo | URL,
      init?: ApiRequestOptions,
    ) => {
      calls.push({ input, init });
      return response as T;
    };
    const service = createReportService(request);

    await expect(service.listByAssessmentId(assessmentId)).resolves.toEqual(
      response.data,
    );
    expect(calls).toEqual([
      {
        input: '/api/reports',
        init: {
          method: 'GET',
          query: { assessmentId },
          signal: undefined,
        },
      },
    ]);
  });
});

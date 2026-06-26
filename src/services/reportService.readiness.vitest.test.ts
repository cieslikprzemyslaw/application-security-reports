import { describe, expect, it } from 'vitest';

import { previewApiRequest } from '~/app/pages/reports/reportPreview.testFixtures';

import { ApiResponseParseError } from './apiClient';
import { createReportService } from './reportService';

import type { ApiRequestOptions } from './apiClient';
import type { ApiRequestFn } from './serviceHelpers';

const reportId = 'rpt_00000000-0000-0000-0000-000000000232';

type RequestCall = {
  input: RequestInfo | URL;
  init?: ApiRequestOptions;
};

const createRequest = (response: unknown) => {
  const calls: RequestCall[] = [];
  const request: ApiRequestFn = async <T>(
    input: RequestInfo | URL,
    init?: ApiRequestOptions,
  ) => {
    calls.push({ input, init });
    return response as T;
  };

  return { calls, request };
};

describe('reportService.readiness', () => {
  it('posts the exact validated preview request and parses backend readiness', async () => {
    const readiness = {
      errors: [
        {
          code: 'THREAT_DESCRIPTION_REQUIRED',
          message: 'Threat description is required.',
          target: {
            resourceType: 'threat',
            resourceId: 'thr_00000000-0000-0000-0000-000000000001',
            field: 'description',
          },
        },
      ],
      warnings: [
        {
          code: 'EVIDENCE_SELECTION_EMPTY',
          message: 'No Evidence is selected.',
          target: {
            resourceType: 'report',
            resourceId: reportId,
            field: 'selection.evidenceIds',
          },
        },
      ],
    };
    const { calls, request } = createRequest({ data: readiness });
    const service = createReportService(request);

    await expect(
      service.readiness(reportId, previewApiRequest),
    ).resolves.toEqual(readiness);
    expect(calls).toEqual([
      {
        input: `/api/reports/${reportId}/readiness`,
        init: {
          method: 'POST',
          body: previewApiRequest,
          signal: undefined,
        },
      },
    ]);
  });

  it('rejects malformed readiness data instead of trusting it', async () => {
    const { request } = createRequest({
      data: {
        errors: [{ code: 'UNKNOWN', message: 'Unsafe', target: {} }],
        warnings: [],
      },
    });
    const service = createReportService(request);

    await expect(
      service.readiness(reportId, previewApiRequest),
    ).rejects.toBeInstanceOf(ApiResponseParseError);
  });
});

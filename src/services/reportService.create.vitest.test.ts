import { describe, expect, it } from 'vitest';

import { ApiResponseParseError } from './apiClient';
import { createReportService } from './reportService';

import type { ApiRequestOptions } from './apiClient';
import type { ApiRequestFn } from './serviceHelpers';

const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';
const threatId = 'thr_00000000-0000-0000-0000-000000000001';

const requestBody = {
  assessmentId,
  title: 'Customer Services Portal Security Report',
  selectedThreatIds: [threatId],
  executiveSummary: 'Initial summary',
};

const createdReport = {
  id: 'rpt_00000000-0000-0000-0000-000000000001',
  assessmentId,
  title: 'Customer Services Portal Security Report',
  status: 'draft' as const,
  selectedThreatIds: [threatId],
  latestVersion: 0,
  executiveSummary: 'Initial summary',
  createdAt: '2026-06-25T10:00:00.000Z',
  updatedAt: '2026-06-25T10:00:00.000Z',
};

describe('reportService.create', () => {
  it('validates the payload, calls POST /api/reports and validates the response', async () => {
    const calls: Array<{
      input: RequestInfo | URL;
      init?: ApiRequestOptions;
    }> = [];

    const request: ApiRequestFn = async <T>(
      input: RequestInfo | URL,
      init?: ApiRequestOptions,
    ) => {
      calls.push({ input, init });

      return {
        data: createdReport,
      } as T;
    };

    const service = createReportService(request);

    await expect(service.create(requestBody)).resolves.toEqual(createdReport);

    expect(calls).toEqual([
      {
        input: '/api/reports',
        init: {
          method: 'POST',
          body: requestBody,
          signal: undefined,
        },
      },
    ]);
  });

  it('rejects malformed input before making an API request', async () => {
    let called = false;

    const request: ApiRequestFn = async <T>() => {
      called = true;
      return undefined as T;
    };

    const service = createReportService(request);

    await expect(
      service.create({
        ...requestBody,
        assessmentId: 'invalid-assessment-id',
      }),
    ).rejects.toThrow();

    expect(called).toBe(false);
  });

  it('rejects malformed API responses', async () => {
    const request: ApiRequestFn = async <T>() =>
      ({
        data: {
          ...createdReport,
          id: 'invalid-report-id',
        },
      }) as T;

    const service = createReportService(request);

    await expect(service.create(requestBody)).rejects.toBeInstanceOf(
      ApiResponseParseError,
    );
  });
});

import { describe, expect, it } from 'vitest';

import {
  previewApiRequest,
  previewSnapshot,
} from '~/app/pages/reports/reportPreview.testFixtures';

import { ApiResponseParseError } from './apiClient';
import { createReportService } from './reportService';

import type { ApiRequestOptions } from './apiClient';
import type { ApiRequestFn } from './serviceHelpers';

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

describe('reportService.preview', () => {
  it('sends the exact validated request and validates the returned snapshot', async () => {
    const { calls, request } = createRequest({ data: previewSnapshot });
    const service = createReportService(request);

    await expect(service.preview(previewApiRequest)).resolves.toEqual(
      previewSnapshot,
    );
    expect(calls).toEqual([
      {
        input: '/api/reports/preview',
        init: {
          method: 'POST',
          body: previewApiRequest,
          signal: undefined,
        },
      },
    ]);
  });

  it('rejects a response that does not match the public snapshot schema', async () => {
    const { request } = createRequest({ data: { company: {} } });
    const service = createReportService(request);

    await expect(service.preview(previewApiRequest)).rejects.toBeInstanceOf(
      ApiResponseParseError,
    );
  });
});

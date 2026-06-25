import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import {
  previewApiRequest,
  previewSnapshot,
} from '~/app/pages/reports/reportPreview.testFixtures';
import type {
  CreateDraftReportVersionRequest,
  CreateFinalReportVersionRequest,
  ReportVersionResponse,
} from '~/domain';

import { ApiError, ApiResponseParseError } from './apiClient';
import { createReportVersionService } from './reportVersionService';

import type { ApiRequestOptions } from './apiClient';
import type { ApiRequestFn } from './serviceHelpers';

type RequestCall = {
  input: RequestInfo | URL;
  init?: ApiRequestOptions;
};

const reportId = 'rpt_00000000-0000-0000-0000-000000000001';
const versionId = 'rvs_00000000-0000-0000-0000-000000000001';

const reportVersion: ReportVersionResponse = {
  id: versionId,
  reportId,
  version: 1,
  status: 'draft',
  generatedAt: '2026-06-25',
  snapshot: previewSnapshot,
};

const finalRequest: CreateFinalReportVersionRequest = {
  ...previewApiRequest,
  expectedLatestVersion: 1,
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

const createRejectingRequest = (error: Error) => {
  const calls: RequestCall[] = [];
  const request: ApiRequestFn = async <T>(
    input: RequestInfo | URL,
    init?: ApiRequestOptions,
  ): Promise<T> => {
    calls.push({ input, init });
    throw error;
  };

  return { calls, request };
};

describe('reportVersionService', () => {
  it('lists validated ReportVersions through the nested Report endpoint', async () => {
    const controller = new AbortController();
    const { calls, request } = createRequest({ data: [reportVersion] });
    const service = createReportVersionService(request);

    await expect(service.list(reportId, controller.signal)).resolves.toEqual([
      reportVersion,
    ]);
    expect(calls).toEqual([
      {
        input: `/api/reports/${reportId}/versions`,
        init: {
          method: 'GET',
          signal: controller.signal,
        },
      },
    ]);
  });

  it('reads one validated ReportVersion through the nested Report endpoint', async () => {
    const { calls, request } = createRequest({ data: reportVersion });
    const service = createReportVersionService(request);

    await expect(service.getById(reportId, versionId)).resolves.toEqual(
      reportVersion,
    );
    expect(calls).toEqual([
      {
        input: `/api/reports/${reportId}/versions/${versionId}`,
        init: {
          method: 'GET',
          signal: undefined,
        },
      },
    ]);
  });

  it('creates a draft with the exact validated backend-owned payload', async () => {
    const input: CreateDraftReportVersionRequest = previewApiRequest;
    const { calls, request } = createRequest({ data: reportVersion });
    const service = createReportVersionService(request);

    await expect(service.createDraft(reportId, input)).resolves.toEqual(
      reportVersion,
    );
    expect(calls).toEqual([
      {
        input: `/api/reports/${reportId}/versions/draft`,
        init: {
          method: 'POST',
          body: input,
          signal: undefined,
        },
      },
    ]);
    expect(calls[0]?.init?.body).not.toHaveProperty('version');
  });

  it('creates a final version with the optimistic-concurrency token', async () => {
    const finalVersion: ReportVersionResponse = {
      ...reportVersion,
      version: 10,
      status: 'final',
    };
    const { calls, request } = createRequest({ data: finalVersion });
    const service = createReportVersionService(request);

    await expect(service.createFinal(reportId, finalRequest)).resolves.toEqual(
      finalVersion,
    );
    expect(calls).toEqual([
      {
        input: `/api/reports/${reportId}/versions/final`,
        init: {
          method: 'POST',
          body: finalRequest,
          signal: undefined,
        },
      },
    ]);
  });

  it.each([
    ['list', () => ({ data: [{ ...reportVersion, id: 'wrong-id' }] })],
    ['read', () => ({ data: { ...reportVersion, reportId: 'wrong-id' } })],
    ['draft', () => ({ data: { ...reportVersion, filePath: '/private' } })],
    ['final', () => ({ data: { ...reportVersion, version: 0 } })],
  ])('rejects a malformed %s response safely', async (operation, response) => {
    const { request } = createRequest(response());
    const service = createReportVersionService(request);

    let action: Promise<unknown>;

    switch (operation) {
      case 'list':
        action = service.list(reportId);
        break;
      case 'read':
        action = service.getById(reportId, versionId);
        break;
      case 'draft':
        action = service.createDraft(reportId, previewApiRequest);
        break;
      case 'final':
        action = service.createFinal(reportId, finalRequest);
        break;
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }

    await expect(action).rejects.toBeInstanceOf(ApiResponseParseError);
  });

  it('rejects invalid create payloads before making a request', async () => {
    const { calls, request } = createRequest({ data: reportVersion });
    const service = createReportVersionService(request);
    const invalidDraft = {
      ...previewApiRequest,
      version: 99,
    } as unknown as CreateDraftReportVersionRequest;
    const invalidFinal = {
      ...previewApiRequest,
    } as unknown as CreateFinalReportVersionRequest;

    await expect(
      service.createDraft(reportId, invalidDraft),
    ).rejects.toBeInstanceOf(ZodError);
    await expect(
      service.createFinal(reportId, invalidFinal),
    ).rejects.toBeInstanceOf(ZodError);
    expect(calls).toHaveLength(0);
  });

  it.each([
    ['REPORT_VERSION_CONFLICT', 409],
    ['REPORT_VERSION_SEQUENCE_EXHAUSTED', 409],
    ['REPORT_FINALISATION_BLOCKED', 409],
    ['REPORT_NOT_FOUND', 404],
  ])('preserves the stable %s API error', async (code, status) => {
    const apiError = new ApiError('Safe public error', status, [], code);
    const { request } = createRejectingRequest(apiError);
    const service = createReportVersionService(request);

    await expect(service.createFinal(reportId, finalRequest)).rejects.toBe(
      apiError,
    );
  });
});

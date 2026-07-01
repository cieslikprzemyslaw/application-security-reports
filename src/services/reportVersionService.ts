import type {
  CreateDraftReportVersionRequest,
  CreateFinalReportVersionRequest,
  DeleteReportVersionResponse,
  ReportVersionResponse,
} from '~/domain';
import {
  createDraftReportVersionRequestSchema,
  createFinalReportVersionRequestSchema,
  deleteReportVersionResponseSchema,
  reportVersionListResponseSchema,
  reportVersionResponseSchema,
} from '~/domain/schemas';

import { ApiResponseParseError, apiRequest } from './apiClient.js';
import { requestData, type ApiRequestFn } from './serviceHelpers.js';

export interface ReportVersionService {
  list(
    reportId: string,
    signal?: AbortSignal,
  ): Promise<ReportVersionResponse[]>;
  getById(
    reportId: string,
    versionId: string,
    signal?: AbortSignal,
  ): Promise<ReportVersionResponse>;
  createDraft(
    reportId: string,
    input: CreateDraftReportVersionRequest,
    signal?: AbortSignal,
  ): Promise<ReportVersionResponse>;
  createFinal(
    reportId: string,
    input: CreateFinalReportVersionRequest,
    signal?: AbortSignal,
  ): Promise<ReportVersionResponse>;
  deleteVersion(
    reportId: string,
    versionId: string,
    signal?: AbortSignal,
  ): Promise<DeleteReportVersionResponse>;
}

const parseReportVersion = (value: unknown): ReportVersionResponse => {
  const parsed = reportVersionResponseSchema.safeParse(value);

  if (!parsed.success) {
    throw new ApiResponseParseError(
      'Unable to validate the report version response.',
    );
  }

  return parsed.data;
};

const parseReportVersionList = (value: unknown): ReportVersionResponse[] => {
  const parsed = reportVersionListResponseSchema.safeParse(value);

  if (!parsed.success) {
    throw new ApiResponseParseError(
      'Unable to validate the report version list response.',
    );
  }

  return parsed.data;
};

const parseDeleteReportVersionResponse = (
  value: unknown,
): DeleteReportVersionResponse => {
  const parsed = deleteReportVersionResponseSchema.safeParse(value);

  if (!parsed.success) {
    throw new ApiResponseParseError(
      'Unable to validate the deleted report version response.',
    );
  }

  return parsed.data;
};

export const createReportVersionService = (
  request: ApiRequestFn = apiRequest,
): ReportVersionService => ({
  async list(reportId, signal) {
    const response = await requestData<unknown>(
      request,
      `/api/reports/${reportId}/versions`,
      {
        method: 'GET',
        signal,
      },
    );

    return parseReportVersionList(response);
  },

  async getById(reportId, versionId, signal) {
    const response = await requestData<unknown>(
      request,
      `/api/reports/${reportId}/versions/${versionId}`,
      {
        method: 'GET',
        signal,
      },
    );

    return parseReportVersion(response);
  },

  async createDraft(reportId, input, signal) {
    const validatedRequest = createDraftReportVersionRequestSchema.parse(input);
    const response = await requestData<unknown>(
      request,
      `/api/reports/${reportId}/versions/draft`,
      {
        method: 'POST',
        body: validatedRequest,
        signal,
      },
    );

    return parseReportVersion(response);
  },

  async createFinal(reportId, input, signal) {
    const validatedRequest = createFinalReportVersionRequestSchema.parse(input);
    const response = await requestData<unknown>(
      request,
      `/api/reports/${reportId}/versions/final`,
      {
        method: 'POST',
        body: validatedRequest,
        signal,
      },
    );

    return parseReportVersion(response);
  },

  async deleteVersion(reportId, versionId, signal) {
    const response = await requestData<unknown>(
      request,
      `/api/reports/${reportId}/versions/${versionId}`,
      {
        method: 'DELETE',
        signal,
      },
    );

    return parseDeleteReportVersionResponse(response);
  },
});

export const reportVersionService = createReportVersionService();

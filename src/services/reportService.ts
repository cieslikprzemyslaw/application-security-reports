import type {
  AssessmentReportListItem,
  CreateReportRequest,
  Report,
  ReportPreviewRequest,
  ReportPreviewSnapshot,
  ReportReadinessResult,
  ReportView,
} from '~/domain';
import {
  assessmentReportListResponseSchema,
  createReportRequestSchema,
  reportPreviewRequestSchema,
  reportPreviewSnapshotSchema,
  reportReadinessResultSchema,
  reportResponseSchema,
} from '~/domain/schemas';

import { ApiResponseParseError, apiRequest } from './apiClient.js';
import { requestData, type ApiRequestFn } from './serviceHelpers.js';

export interface ReportService {
  create(input: CreateReportRequest, signal?: AbortSignal): Promise<Report>;
  listByAssessmentId(
    assessmentId: string,
    signal?: AbortSignal,
  ): Promise<AssessmentReportListItem[]>;
  getById(reportId: string, signal?: AbortSignal): Promise<ReportView>;
  preview(
    input: ReportPreviewRequest,
    signal?: AbortSignal,
  ): Promise<ReportPreviewSnapshot>;
  readiness(
    reportId: string,
    input: ReportPreviewRequest,
    signal?: AbortSignal,
  ): Promise<ReportReadinessResult>;
}

export const createReportService = (
  request: ApiRequestFn = apiRequest,
): ReportService => ({
  async create(input, signal) {
    const validatedRequest = createReportRequestSchema.parse(input);
    const response = await requestData<unknown>(request, '/api/reports', {
      method: 'POST',
      body: validatedRequest,
      signal,
    });
    const parsed = reportResponseSchema.safeParse(response);

    if (!parsed.success) {
      throw new ApiResponseParseError(
        'Unable to validate the created Report response.',
      );
    }

    return parsed.data;
  },

  async listByAssessmentId(assessmentId, signal) {
    const response = await requestData<unknown>(request, '/api/reports', {
      method: 'GET',
      query: { assessmentId },
      signal,
    });
    const parsed = assessmentReportListResponseSchema.safeParse(response);

    if (!parsed.success) {
      throw new ApiResponseParseError(
        'Unable to validate the assessment report list response.',
      );
    }

    return parsed.data;
  },

  async getById(reportId, signal) {
    return requestData<ReportView>(request, `/api/reports/${reportId}`, {
      method: 'GET',
      signal,
    });
  },

  async preview(input, signal) {
    const validatedRequest = reportPreviewRequestSchema.parse(input);
    const response = await requestData<unknown>(
      request,
      '/api/reports/preview',
      {
        method: 'POST',
        body: validatedRequest,
        signal,
      },
    );

    const parsed = reportPreviewSnapshotSchema.safeParse(response);

    if (!parsed.success) {
      throw new ApiResponseParseError(
        'Unable to validate the report preview response.',
      );
    }

    return parsed.data;
  },

  async readiness(reportId, input, signal) {
    const validatedRequest = reportPreviewRequestSchema.parse(input);
    const response = await requestData<unknown>(
      request,
      `/api/reports/${reportId}/readiness`,
      {
        method: 'POST',
        body: validatedRequest,
        signal,
      },
    );
    const parsed = reportReadinessResultSchema.safeParse(response);

    if (!parsed.success) {
      throw new ApiResponseParseError(
        'Unable to validate the Report readiness response.',
      );
    }

    return parsed.data;
  },
});

export const reportService = createReportService();

import type { ReportView } from '~/domain';

import { apiRequest } from './apiClient.js';
import { requestData, type ApiRequestFn } from './serviceHelpers.js';

export interface ReportService {
  getById(reportId: string, signal?: AbortSignal): Promise<ReportView>;
}

export const createReportService = (
  request: ApiRequestFn = apiRequest,
): ReportService => ({
  async getById(reportId, signal) {
    return requestData<ReportView>(request, `/api/reports/${reportId}`, {
      method: 'GET',
      signal,
    });
  },
});

export const reportService = createReportService();

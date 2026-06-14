import type { Assessment } from '~/domain';

import { apiRequest } from './apiClient.js';
import { requestData, type ApiRequestFn } from './serviceHelpers.js';

export type AssessmentCreateInput = Omit<
  Assessment,
  'id' | 'createdAt' | 'updatedAt'
>;

export type AssessmentUpdateInput = Partial<
  Omit<AssessmentCreateInput, 'companyId'>
>;

export interface AssessmentService {
  list(
    filters?: {
      companyId?: string;
    },
    signal?: AbortSignal,
  ): Promise<Assessment[]>;
  getById(assessmentId: string, signal?: AbortSignal): Promise<Assessment>;
  create(input: AssessmentCreateInput): Promise<Assessment>;
  update(
    assessmentId: string,
    input: AssessmentUpdateInput,
  ): Promise<Assessment>;
  remove(assessmentId: string): Promise<void>;
}

export const createAssessmentService = (
  request: ApiRequestFn = apiRequest,
): AssessmentService => ({
  async list(filters, signal) {
    return requestData<Assessment[]>(request, '/api/assessments', {
      method: 'GET',
      query: {
        companyId: filters?.companyId,
      },
      signal,
    });
  },

  async getById(assessmentId, signal) {
    return requestData<Assessment>(
      request,
      `/api/assessments/${assessmentId}`,
      {
        method: 'GET',
        signal,
      },
    );
  },

  async create(input) {
    return requestData<Assessment>(request, '/api/assessments', {
      body: input,
      method: 'POST',
    });
  },

  async update(assessmentId, input) {
    return requestData<Assessment>(
      request,
      `/api/assessments/${assessmentId}`,
      {
        body: input,
        method: 'PATCH',
      },
    );
  },

  async remove(assessmentId) {
    await request(`/api/assessments/${assessmentId}`, {
      method: 'DELETE',
    });
  },
});

export const assessmentService = createAssessmentService();

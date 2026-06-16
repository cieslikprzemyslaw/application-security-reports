import type { Assessment, AssessmentStatus } from '~/domain';

import { apiRequest } from './apiClient.js';
import { requestData, type ApiRequestFn } from './serviceHelpers.js';

export type AssessmentCreateInput = Omit<
  Assessment,
  'id' | 'createdAt' | 'updatedAt'
>;

export type AssessmentUpdateInput = Partial<
  Omit<AssessmentCreateInput, 'companyId'>
>;

export interface AssessmentListItem {
  id: string;
  companyId?: string;
  name: string;
  type: string;
  status: AssessmentStatus;
  findingsCount: number;
  updatedAt: string;
  description?: string;
  scope?: string;
}

interface AssessmentListApiItem {
  id: string;
  companyId?: string;
  title?: string;
  name?: string;
  assessmentType?: string;
  type?: string;
  status: AssessmentStatus;
  findingsCount?: number;
  updatedAt: string;
  description?: string;
  scope?: string;
}

const mapAssessmentListItem = (
  item: AssessmentListApiItem,
): AssessmentListItem => ({
  id: item.id,
  companyId: item.companyId,
  name: item.name ?? item.title ?? 'Untitled assessment',
  type: item.type ?? item.assessmentType ?? 'Unspecified',
  status: item.status,
  findingsCount: item.findingsCount ?? 0,
  updatedAt: item.updatedAt,
  description: item.description,
  scope: item.scope,
});

export interface AssessmentService {
  list(
    filters?: {
      companyId?: string;
    },
    signal?: AbortSignal,
  ): Promise<AssessmentListItem[]>;
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
    const items = await requestData<AssessmentListApiItem[]>(
      request,
      '/api/assessments',
      {
        method: 'GET',
        query: {
          companyId: filters?.companyId,
        },
        signal,
      },
    );

    return items.map(mapAssessmentListItem);
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

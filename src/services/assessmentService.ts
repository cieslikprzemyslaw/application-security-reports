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

export interface AssessmentWorkspaceCompany {
  id: string;
  name: string;
}

export interface AssessmentWorkspaceAssessment extends Assessment {
  recordVersion: number;
  findingsCount: number;
  evidenceCount: number;
  reportVersionCount: number;
  testerName?: string;
  availableActions?: AssessmentWorkspaceCommand[];
}

export interface AssessmentWorkspaceOverview {
  company: AssessmentWorkspaceCompany;
  assessment: AssessmentWorkspaceAssessment;
}

export type AssessmentWorkspaceCommand =
  | 'start'
  | 'complete'
  | 'reopen'
  | 'archive';

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

const buildWorkspaceAssessmentUrl = (
  companyId: string,
  assessmentId: string,
  suffix = '',
) =>
  `/api/companies/${companyId}/assessments/${assessmentId}${
    suffix.length > 0 ? `/${suffix}` : ''
  }`;

const runAssessmentCommand = (
  request: ApiRequestFn,
  companyId: string,
  assessmentId: string,
  command: AssessmentWorkspaceCommand,
  recordVersion: number,
  signal?: AbortSignal,
) =>
  requestData<AssessmentWorkspaceOverview>(
    request,
    buildWorkspaceAssessmentUrl(companyId, assessmentId, `commands/${command}`),
    {
      body: { recordVersion },
      method: 'POST',
      signal,
    },
  );

export interface AssessmentService {
  list(
    filters?: {
      companyId?: string;
    },
    signal?: AbortSignal,
  ): Promise<AssessmentListItem[]>;
  getById(assessmentId: string, signal?: AbortSignal): Promise<Assessment>;
  getOverview(
    companyId: string,
    assessmentId: string,
    signal?: AbortSignal,
  ): Promise<AssessmentWorkspaceOverview>;
  create(input: AssessmentCreateInput): Promise<Assessment>;
  update(
    assessmentId: string,
    input: AssessmentUpdateInput,
  ): Promise<Assessment>;
  start(
    companyId: string,
    assessmentId: string,
    recordVersion: number,
    signal?: AbortSignal,
  ): Promise<AssessmentWorkspaceOverview>;
  complete(
    companyId: string,
    assessmentId: string,
    recordVersion: number,
    signal?: AbortSignal,
  ): Promise<AssessmentWorkspaceOverview>;
  reopen(
    companyId: string,
    assessmentId: string,
    recordVersion: number,
    signal?: AbortSignal,
  ): Promise<AssessmentWorkspaceOverview>;
  archive(
    companyId: string,
    assessmentId: string,
    recordVersion: number,
    signal?: AbortSignal,
  ): Promise<AssessmentWorkspaceOverview>;
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

  async getOverview(companyId, assessmentId, signal) {
    return requestData<AssessmentWorkspaceOverview>(
      request,
      buildWorkspaceAssessmentUrl(companyId, assessmentId, 'overview'),
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

  async start(companyId, assessmentId, recordVersion, signal) {
    return runAssessmentCommand(
      request,
      companyId,
      assessmentId,
      'start',
      recordVersion,
      signal,
    );
  },

  async complete(companyId, assessmentId, recordVersion, signal) {
    return runAssessmentCommand(
      request,
      companyId,
      assessmentId,
      'complete',
      recordVersion,
      signal,
    );
  },

  async reopen(companyId, assessmentId, recordVersion, signal) {
    return runAssessmentCommand(
      request,
      companyId,
      assessmentId,
      'reopen',
      recordVersion,
      signal,
    );
  },

  async archive(companyId, assessmentId, recordVersion, signal) {
    return runAssessmentCommand(
      request,
      companyId,
      assessmentId,
      'archive',
      recordVersion,
      signal,
    );
  },

  async remove(assessmentId) {
    await request(`/api/assessments/${assessmentId}`, {
      method: 'DELETE',
    });
  },
});

export const assessmentService = createAssessmentService();

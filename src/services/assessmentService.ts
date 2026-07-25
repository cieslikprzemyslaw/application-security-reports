import type {
  Assessment,
  AssessmentStatus,
  ISODateString,
  Severity,
} from '~/domain';
import { isCweCatalogVersion, isOwaspTop10Version } from '~/domain';

import { ApiResponseParseError, apiRequest } from './apiClient.js';
import { requestData, type ApiRequestFn } from './serviceHelpers.js';

export interface AssessmentCreateInput {
  companyId: string;
  title: string;
  description?: string;
  scope?: string;
  status: AssessmentStatus;
  startedAt?: ISODateString;
  completedAt?: ISODateString;
  applicationName: string;
  environment?: string;
  assessmentType?: string;
  overallRisk?: Severity;
}
export interface AssessmentUpdateInput {
  title?: string;
  description?: string;
  scope?: string;
  status?: AssessmentStatus;
  startedAt?: ISODateString;
  completedAt?: ISODateString;
  applicationName?: string;
  environment?: string;
  assessmentType?: string;
  overallRisk?: Severity;
}
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
export interface AssessmentDeleteResult {
  cleanupWarnings: string[];
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
  applicationName?: string;
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
  applicationName?: string;
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
  applicationName: item.applicationName,
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

const normaliseCleanupWarnings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === 'string' && item.trim().length > 0,
      )
    : [];

const validateAssessmentVersion = <T extends Assessment>(
  assessment: T,
  message: string,
): T => {
  if (
    !isOwaspTop10Version(assessment.owaspTaxonomyVersion) ||
    !isCweCatalogVersion(assessment.cweCatalogVersion)
  ) {
    throw new ApiResponseParseError(message);
  }

  return assessment;
};

const validateAssessmentOverview = (
  overview: AssessmentWorkspaceOverview,
  message: string,
): AssessmentWorkspaceOverview => ({
  ...overview,
  assessment: validateAssessmentVersion(overview.assessment, message),
});

const runAssessmentCommand = async (
  request: ApiRequestFn,
  companyId: string,
  assessmentId: string,
  command: AssessmentWorkspaceCommand,
  recordVersion: number,
  signal?: AbortSignal,
) => {
  const response = await requestData<AssessmentWorkspaceOverview>(
    request,
    buildWorkspaceAssessmentUrl(companyId, assessmentId, `commands/${command}`),
    {
      body: { recordVersion },
      method: 'POST',
      signal,
    },
  );

  return validateAssessmentOverview(
    response,
    'Unable to validate the Assessment command response.',
  );
};

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
  remove(assessmentId: string): Promise<AssessmentDeleteResult>;
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
    const response = await requestData<Assessment>(
      request,
      `/api/assessments/${assessmentId}`,
      {
        method: 'GET',
        signal,
      },
    );

    return validateAssessmentVersion(
      response,
      'Unable to validate the Assessment response.',
    );
  },

  async getOverview(companyId, assessmentId, signal) {
    const response = await requestData<AssessmentWorkspaceOverview>(
      request,
      buildWorkspaceAssessmentUrl(companyId, assessmentId, 'overview'),
      {
        method: 'GET',
        signal,
      },
    );

    return validateAssessmentOverview(
      response,
      'Unable to validate the Assessment overview response.',
    );
  },

  async create(input) {
    const response = await requestData<Assessment>(
      request,
      '/api/assessments',
      {
        body: input,
        method: 'POST',
      },
    );

    return validateAssessmentVersion(
      response,
      'Unable to validate the created Assessment response.',
    );
  },

  async update(assessmentId, input) {
    const response = await requestData<Assessment>(
      request,
      `/api/assessments/${assessmentId}`,
      {
        body: input,
        method: 'PATCH',
      },
    );

    return validateAssessmentVersion(
      response,
      'Unable to validate the updated Assessment response.',
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
    const response = await request<{
      data?: { cleanupWarnings?: unknown; warnings?: unknown };
      warnings?: unknown;
    }>(`/api/assessments/${assessmentId}`, {
      method: 'DELETE',
    });

    return {
      cleanupWarnings: normaliseCleanupWarnings(
        response?.data?.cleanupWarnings ??
          response?.data?.warnings ??
          response?.warnings,
      ),
    };
  },
});

export const assessmentService = createAssessmentService();

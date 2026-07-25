import type {
  Assessment,
  AssessmentDeletionImpact,
  AssessmentStatus,
  ISODateString,
  Severity,
} from '~/domain';
import { isCweCatalogVersion, isOwaspTop10Version } from '~/domain';
import {
  assessmentDeletionImpactSchema,
  assessmentPermanentDeleteResultSchema,
} from '~/domain/schemas';

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
  startedAt?: ISODateString;
  applicationName?: string;
  environment?: string;
  assessmentType?: string;
  overallRisk?: Severity;
}

export interface AssessmentWorkspaceCompany {
  id: string;
  name: string;
}

export type AssessmentWorkspaceCommand =
  | 'start'
  | 'complete'
  | 'reopen'
  | 'archive'
  | 'restore';

export interface AssessmentWorkspaceAssessment extends Assessment {
  recordVersion: number;
  archivedAt: ISODateString | null;
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
    filters?: { companyId?: string },
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
  restore(
    companyId: string,
    assessmentId: string,
    recordVersion: number,
    signal?: AbortSignal,
  ): Promise<AssessmentWorkspaceOverview>;
  getDeletionImpact(
    assessmentId: string,
    signal?: AbortSignal,
  ): Promise<AssessmentDeletionImpact>;
  remove(
    assessmentId: string,
    recordVersion?: number,
  ): Promise<AssessmentDeleteResult>;
}

export const createAssessmentService = (
  request: ApiRequestFn = apiRequest,
): AssessmentService => {
  const command = (
    name: AssessmentWorkspaceCommand,
    companyId: string,
    assessmentId: string,
    recordVersion: number,
    signal?: AbortSignal,
  ) =>
    runAssessmentCommand(
      request,
      companyId,
      assessmentId,
      name,
      recordVersion,
      signal,
    );

  return {
    async list(filters, signal) {
      const items = await requestData<AssessmentListApiItem[]>(
        request,
        '/api/assessments',
        {
          method: 'GET',
          query: { companyId: filters?.companyId },
          signal,
        },
      );

      return items.map(mapAssessmentListItem);
    },

    async getById(assessmentId, signal) {
      const response = await requestData<Assessment>(
        request,
        `/api/assessments/${assessmentId}`,
        { method: 'GET', signal },
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
        { method: 'GET', signal },
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
        { body: input, method: 'PATCH' },
      );

      return validateAssessmentVersion(
        response,
        'Unable to validate the updated Assessment response.',
      );
    },

    start: (companyId, assessmentId, recordVersion, signal) =>
      command('start', companyId, assessmentId, recordVersion, signal),
    complete: (companyId, assessmentId, recordVersion, signal) =>
      command('complete', companyId, assessmentId, recordVersion, signal),
    reopen: (companyId, assessmentId, recordVersion, signal) =>
      command('reopen', companyId, assessmentId, recordVersion, signal),
    archive: (companyId, assessmentId, recordVersion, signal) =>
      command('archive', companyId, assessmentId, recordVersion, signal),
    restore: (companyId, assessmentId, recordVersion, signal) =>
      command('restore', companyId, assessmentId, recordVersion, signal),

    async getDeletionImpact(assessmentId, signal) {
      const response = await requestData<unknown>(
        request,
        `/api/assessments/${assessmentId}/deletion-impact`,
        { method: 'GET', signal },
      );
      const result = assessmentDeletionImpactSchema.safeParse(response);

      if (!result.success) {
        throw new ApiResponseParseError(
          'Unable to validate the Assessment deletion impact response.',
        );
      }

      return result.data;
    },

    async remove(assessmentId, recordVersion) {
      const response = await requestData<unknown>(
        request,
        `/api/assessments/${assessmentId}`,
        {
          body: recordVersion === undefined ? {} : { recordVersion },
          method: 'DELETE',
        },
      );
      const result = assessmentPermanentDeleteResultSchema.safeParse(response);

      if (!result.success) {
        return { cleanupWarnings: [] };
      }

      return {
        cleanupWarnings: normaliseCleanupWarnings(result.data.cleanupWarnings),
      };
    },
  };
};

export const assessmentService = createAssessmentService();

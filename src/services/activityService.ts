import type { Activity } from '~/domain';
import { activityFileSchema } from '~/domain/schemas';

import { ApiResponseParseError, apiRequest } from './apiClient.js';
import { requestData, type ApiRequestFn } from './serviceHelpers.js';

const parseActivityList = (value: unknown): Activity[] => {
  const parsed = activityFileSchema.safeParse(value);

  if (!parsed.success) {
    throw new ApiResponseParseError('Unable to validate the Activity response.');
  }

  return parsed.data;
};

const withLimit = (path: string, limit?: number) => {
  if (limit === undefined) {
    return path;
  }

  const query = new URLSearchParams({ limit: String(limit) });
  return `${path}?${query.toString()}`;
};

export interface ActivityService {
  listByCompany(
    companyId: string,
    limit?: number,
    signal?: AbortSignal,
  ): Promise<Activity[]>;
  listByAssessment(
    companyId: string,
    assessmentId: string,
    limit?: number,
    signal?: AbortSignal,
  ): Promise<Activity[]>;
}

export const createActivityService = (
  request: ApiRequestFn = apiRequest,
): ActivityService => ({
  async listByCompany(companyId, limit, signal) {
    const activities = await requestData<unknown>(
      request,
      withLimit(
        `/api/companies/${encodeURIComponent(companyId)}/activity`,
        limit,
      ),
      { method: 'GET', signal },
    );

    return parseActivityList(activities);
  },

  async listByAssessment(companyId, assessmentId, limit, signal) {
    const activities = await requestData<unknown>(
      request,
      withLimit(
        `/api/companies/${encodeURIComponent(
          companyId,
        )}/assessments/${encodeURIComponent(assessmentId)}/activity`,
        limit,
      ),
      { method: 'GET', signal },
    );

    return parseActivityList(activities);
  },
});

export const activityService = createActivityService();

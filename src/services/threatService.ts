import type { Threat } from '~/domain';
import { threatResponseSchema } from '~/domain/schemas';

import { ApiResponseParseError, apiRequest } from './apiClient.js';
import { requestData, type ApiRequestFn } from './serviceHelpers.js';

export type ThreatCreateInput = Omit<
  Threat,
  'id' | 'createdAt' | 'updatedAt' | 'cweCatalogVersion' | 'cweMappings'
> & {
  cweIds?: string[];
};

export type ThreatUpdateInput = Partial<
  Omit<ThreatCreateInput, 'assessmentId'>
>;

const parseThreat = (value: unknown): Threat => {
  const result = threatResponseSchema.safeParse(value);

  if (!result.success) {
    throw new ApiResponseParseError('Unable to validate the Threat response.');
  }

  return result.data;
};

const parseThreatList = (value: unknown): Threat[] => {
  if (!Array.isArray(value)) {
    throw new ApiResponseParseError(
      'Unable to validate the Threat list response.',
    );
  }

  return value.map(parseThreat);
};

export interface ThreatService {
  listByAssessment(
    assessmentId: string,
    signal?: AbortSignal,
  ): Promise<Threat[]>;
  getById(threatId: string, signal?: AbortSignal): Promise<Threat>;
  create(input: ThreatCreateInput): Promise<Threat>;
  update(threatId: string, input: ThreatUpdateInput): Promise<Threat>;
  remove(threatId: string): Promise<void>;
}

export const createThreatService = (
  request: ApiRequestFn = apiRequest,
): ThreatService => ({
  async listByAssessment(assessmentId, signal) {
    const response = await requestData<unknown>(request, '/api/threats', {
      method: 'GET',
      query: { assessmentId },
      signal,
    });

    return parseThreatList(response);
  },

  async getById(threatId, signal) {
    const response = await requestData<unknown>(
      request,
      `/api/threats/${threatId}`,
      { method: 'GET', signal },
    );

    return parseThreat(response);
  },

  async create(input) {
    const response = await requestData<unknown>(request, '/api/threats', {
      body: input,
      method: 'POST',
    });

    return parseThreat(response);
  },

  async update(threatId, input) {
    const response = await requestData<unknown>(
      request,
      `/api/threats/${threatId}`,
      { body: input, method: 'PATCH' },
    );

    return parseThreat(response);
  },

  async remove(threatId) {
    await request(`/api/threats/${threatId}`, { method: 'DELETE' });
  },
});

export const threatService = createThreatService();

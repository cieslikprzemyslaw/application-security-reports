import type { Threat } from '~/domain';

import { apiRequest } from './apiClient.js';
import { requestData, type ApiRequestFn } from './serviceHelpers.js';

export type ThreatCreateInput = Omit<Threat, 'id' | 'createdAt' | 'updatedAt'>;

export type ThreatUpdateInput = Partial<
  Omit<ThreatCreateInput, 'assessmentId'>
>;

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
    return requestData<Threat[]>(request, '/api/threats', {
      method: 'GET',
      query: {
        assessmentId,
      },
      signal,
    });
  },

  async getById(threatId, signal) {
    return requestData<Threat>(request, `/api/threats/${threatId}`, {
      method: 'GET',
      signal,
    });
  },

  async create(input) {
    return requestData<Threat>(request, '/api/threats', {
      body: input,
      method: 'POST',
    });
  },

  async update(threatId, input) {
    return requestData<Threat>(request, `/api/threats/${threatId}`, {
      body: input,
      method: 'PATCH',
    });
  },

  async remove(threatId) {
    await request(`/api/threats/${threatId}`, {
      method: 'DELETE',
    });
  },
});

export const threatService = createThreatService();

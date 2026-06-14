import type { Evidence } from '~/domain';

import { apiRequest } from './apiClient.js';
import { requestData, type ApiRequestFn } from './serviceHelpers.js';

export type EvidenceCreateInput = Omit<
  Evidence,
  'id' | 'createdAt' | 'updatedAt' | 'filePath'
>;

export type EvidenceUpdateInput = Partial<
  Omit<EvidenceCreateInput, 'assessmentId'>
>;

export interface EvidenceListFilters {
  assessmentId: string;
  threatId?: string;
}

export interface EvidenceService {
  list(filters: EvidenceListFilters, signal?: AbortSignal): Promise<Evidence[]>;
  getById(evidenceId: string, signal?: AbortSignal): Promise<Evidence>;
  create(input: EvidenceCreateInput): Promise<Evidence>;
  update(evidenceId: string, input: EvidenceUpdateInput): Promise<Evidence>;
  remove(evidenceId: string): Promise<void>;
}

export const createEvidenceService = (
  request: ApiRequestFn = apiRequest,
): EvidenceService => ({
  async list(filters, signal) {
    const evidence = await requestData<Evidence[]>(request, '/api/evidence', {
      method: 'GET',
      query: {
        assessmentId: filters.assessmentId,
      },
      signal,
    });

    const threatId = filters.threatId;

    if (threatId === undefined) {
      return evidence;
    }

    return evidence.filter(item => item.threatIds.includes(threatId));
  },

  async getById(evidenceId, signal) {
    return requestData<Evidence>(request, `/api/evidence/${evidenceId}`, {
      method: 'GET',
      signal,
    });
  },

  async create(input) {
    return requestData<Evidence>(request, '/api/evidence', {
      body: input,
      method: 'POST',
    });
  },

  async update(evidenceId, input) {
    return requestData<Evidence>(request, `/api/evidence/${evidenceId}`, {
      body: input,
      method: 'PATCH',
    });
  },

  async remove(evidenceId) {
    await request(`/api/evidence/${evidenceId}`, {
      method: 'DELETE',
    });
  },
});

export const evidenceService = createEvidenceService();

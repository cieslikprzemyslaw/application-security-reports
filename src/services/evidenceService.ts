import { evidenceFileSchema, evidenceSchema } from '~/domain/schemas';
import {
  createEvidenceRequestSchema,
  updateEvidenceRequestSchema,
} from '~/domain/schemas/request.schema';
import type { Evidence } from '~/domain';
import type { z } from 'zod';

import { apiRequest } from './apiClient.js';
import { requestData, type ApiRequestFn } from './serviceHelpers.js';

export type EvidenceCreateInput = z.output<typeof createEvidenceRequestSchema>;

export type EvidenceUpdateInput = z.output<typeof updateEvidenceRequestSchema>;

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
    const evidence = await requestData<unknown>(request, '/api/evidence', {
      method: 'GET',
      query: {
        assessmentId: filters.assessmentId,
      },
      signal,
    });
    const parsedEvidence = evidenceFileSchema.parse(evidence);

    const threatId = filters.threatId;

    if (threatId === undefined) {
      return parsedEvidence;
    }

    return parsedEvidence.filter(item => item.threatIds.includes(threatId));
  },

  async getById(evidenceId, signal) {
    const evidence = await requestData<unknown>(
      request,
      `/api/evidence/${evidenceId}`,
      {
        method: 'GET',
        signal,
      },
    );

    return evidenceSchema.parse(evidence);
  },

  async create(input) {
    const evidence = await requestData<unknown>(request, '/api/evidence', {
      body: input,
      method: 'POST',
    });

    return evidenceSchema.parse(evidence);
  },

  async update(evidenceId, input) {
    const evidence = await requestData<unknown>(
      request,
      `/api/evidence/${evidenceId}`,
      {
        body: input,
        method: 'PATCH',
      },
    );

    return evidenceSchema.parse(evidence);
  },

  async remove(evidenceId) {
    await request(`/api/evidence/${evidenceId}`, {
      method: 'DELETE',
    });
  },
});

export const evidenceService = createEvidenceService();

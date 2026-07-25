import type {
  AssessmentTemplate,
  CreateAssessmentTemplateInput,
  UpdateAssessmentTemplateInput,
} from '~/domain';
import {
  assessmentTemplateListResponseSchema,
  assessmentTemplateResponseSchema,
} from '~/domain/schemas';

import { ApiResponseParseError, apiRequest } from './apiClient.js';
import { requestData, type ApiRequestFn } from './serviceHelpers.js';

const parseTemplate = (value: unknown, message: string): AssessmentTemplate => {
  const result = assessmentTemplateResponseSchema.safeParse({ data: value });

  if (!result.success) {
    throw new ApiResponseParseError(message);
  }

  return result.data.data;
};

const parseTemplateList = (
  value: unknown,
  message: string,
): AssessmentTemplate[] => {
  const result = assessmentTemplateListResponseSchema.safeParse({ data: value });

  if (!result.success) {
    throw new ApiResponseParseError(message);
  }

  return result.data.data;
};

export interface AssessmentTemplateService {
  list(
    options?: { includeArchived?: boolean },
    signal?: AbortSignal,
  ): Promise<AssessmentTemplate[]>;
  getById(id: string, signal?: AbortSignal): Promise<AssessmentTemplate>;
  create(input: CreateAssessmentTemplateInput): Promise<AssessmentTemplate>;
  update(
    id: string,
    input: UpdateAssessmentTemplateInput,
  ): Promise<AssessmentTemplate>;
  archive(id: string): Promise<AssessmentTemplate>;
  restore(id: string): Promise<AssessmentTemplate>;
}

export const createAssessmentTemplateService = (
  request: ApiRequestFn = apiRequest,
): AssessmentTemplateService => {
  const transition = async (
    id: string,
    command: 'archive' | 'restore',
  ): Promise<AssessmentTemplate> => {
    const data = await requestData<unknown>(
      request,
      `/api/assessment-templates/${encodeURIComponent(id)}/${command}`,
      { method: 'POST' },
    );

    return parseTemplate(
      data,
      `Unable to validate the Assessment Template ${command} response.`,
    );
  };

  return {
    async list(options, signal) {
      const data = await requestData<unknown[]>(
        request,
        '/api/assessment-templates',
        {
          method: 'GET',
          query: {
            includeArchived: options?.includeArchived ? 'true' : undefined,
          },
          signal,
        },
      );

      return parseTemplateList(
        data,
        'Unable to validate the Assessment Template list response.',
      );
    },

    async getById(id, signal) {
      const data = await requestData<unknown>(
        request,
        `/api/assessment-templates/${encodeURIComponent(id)}`,
        { method: 'GET', signal },
      );

      return parseTemplate(
        data,
        'Unable to validate the Assessment Template response.',
      );
    },

    async create(input) {
      const data = await requestData<unknown>(
        request,
        '/api/assessment-templates',
        { body: input, method: 'POST' },
      );

      return parseTemplate(
        data,
        'Unable to validate the created Assessment Template response.',
      );
    },

    async update(id, input) {
      const data = await requestData<unknown>(
        request,
        `/api/assessment-templates/${encodeURIComponent(id)}`,
        { body: input, method: 'PATCH' },
      );

      return parseTemplate(
        data,
        'Unable to validate the updated Assessment Template response.',
      );
    },

    archive: id => transition(id, 'archive'),
    restore: id => transition(id, 'restore'),
  };
};

export const assessmentTemplateService = createAssessmentTemplateService();

import { describe, expect, it, vi } from 'vitest';

import { ApiResponseParseError } from './apiClient.js';
import type { ApiRequestFn } from './serviceHelpers.js';
import { createAssessmentTemplateService } from './assessmentTemplateService.js';

const template = {
  id: 'tpl_00000000-0000-0000-0000-000000000001',
  name: 'API review',
  assessmentType: 'API',
  environment: 'Production',
  description: 'Reusable defaults',
  scope: 'API routes',
  archivedAt: null,
  createdAt: '2026-07-25T09:00:00.000Z',
  updatedAt: '2026-07-25T09:00:00.000Z',
};

describe('Assessment Template service', () => {
  it('uses the shared API boundary for list, create and transitions', async () => {
    const request = vi.fn(
      async (input: RequestInfo | URL, init) => ({
        data:
          String(input).endsWith('/assessment-templates') &&
          init?.method === 'GET'
            ? [template]
            : template,
      }),
    ) as unknown as ApiRequestFn;
    const service = createAssessmentTemplateService(request);

    await expect(service.list({ includeArchived: true })).resolves.toEqual([
      template,
    ]);
    await expect(
      service.create({
        name: template.name,
        assessmentType: template.assessmentType,
        environment: template.environment,
      }),
    ).resolves.toEqual(template);
    await expect(service.archive(template.id)).resolves.toEqual(template);

    expect(request).toHaveBeenCalledWith(
      '/api/assessment-templates',
      expect.objectContaining({
        method: 'GET',
        query: { includeArchived: 'true' },
      }),
    );
    expect(request).toHaveBeenCalledWith(
      `/api/assessment-templates/${template.id}/archive`,
      expect.objectContaining({ body: {}, method: 'POST' }),
    );
  });

  it('rejects malformed external responses', async () => {
    const request = vi.fn(async () => ({
      data: [{ ...template, id: 'not-a-template-id' }],
    })) as unknown as ApiRequestFn;
    const service = createAssessmentTemplateService(request);

    await expect(service.list()).rejects.toBeInstanceOf(ApiResponseParseError);
  });
});

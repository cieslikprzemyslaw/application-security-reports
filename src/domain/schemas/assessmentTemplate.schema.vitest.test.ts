import { describe, expect, it } from 'vitest';

import {
  assessmentTemplateListQuerySchema,
  assessmentTemplateSchema,
  createAssessmentTemplateRequestSchema,
  updateAssessmentTemplateRequestSchema,
} from './assessmentTemplate.schema.js';

const persistedTemplate = {
  id: 'tpl_00000000-0000-0000-0000-000000000001',
  name: 'Public web application',
  assessmentType: 'Web App',
  environment: 'Production',
  description: 'Reusable application review defaults',
  scope: 'Public routes and authenticated workflows',
  archivedAt: null,
  createdAt: '2026-07-25T09:00:00.000Z',
  updatedAt: '2026-07-25T09:00:00.000Z',
};

const createInput = {
  name: persistedTemplate.name,
  assessmentType: persistedTemplate.assessmentType,
  environment: persistedTemplate.environment,
  description: persistedTemplate.description,
  scope: persistedTemplate.scope,
};

describe('Assessment Template schemas', () => {
  it('accepts the canonical public object', () => {
    expect(assessmentTemplateSchema.parse(persistedTemplate)).toEqual(
      persistedTemplate,
    );
  });

  it('accepts only the approved create fields', () => {
    expect(createAssessmentTemplateRequestSchema.parse(createInput)).toEqual(
      createInput,
    );

    expect(
      createAssessmentTemplateRequestSchema.safeParse({
        ...createInput,
        companyId: 'cmp_00000000-0000-0000-0000-000000000001',
      }).success,
    ).toBe(false);
    expect(
      createAssessmentTemplateRequestSchema.safeParse({
        ...createInput,
        archivedAt: '2026-07-25T09:00:00.000Z',
      }).success,
    ).toBe(false);
  });

  it('requires create fields and rejects invalid boundaries', () => {
    expect(
      createAssessmentTemplateRequestSchema.safeParse({
        ...createInput,
        name: ' ',
      }).success,
    ).toBe(false);
    expect(
      createAssessmentTemplateRequestSchema.safeParse({
        ...createInput,
        assessmentType: 'x'.repeat(201),
      }).success,
    ).toBe(false);
  });

  it('accepts a supported PATCH and rejects empty or server-owned fields', () => {
    expect(
      updateAssessmentTemplateRequestSchema.parse({ name: 'Updated template' }),
    ).toEqual({ name: 'Updated template' });
    expect(updateAssessmentTemplateRequestSchema.safeParse({}).success).toBe(
      false,
    );
    expect(
      updateAssessmentTemplateRequestSchema.safeParse({
        archivedAt: null,
      }).success,
    ).toBe(false);
  });

  it('parses the explicit includeArchived boolean query', () => {
    expect(
      assessmentTemplateListQuerySchema.parse({ includeArchived: 'true' }),
    ).toEqual({ includeArchived: true });
    expect(
      assessmentTemplateListQuerySchema.parse({ includeArchived: 'false' }),
    ).toEqual({ includeArchived: false });
    expect(
      assessmentTemplateListQuerySchema.safeParse({ includeArchived: 'yes' })
        .success,
    ).toBe(false);
  });
});

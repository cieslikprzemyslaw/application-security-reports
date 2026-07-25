import { describe, expect, it } from 'vitest';

import { createEmptyAssessmentFormValue } from '~/app/components/appsec/assessmentForm';
import type { AssessmentTemplate } from '~/domain';

import {
  applyAssessmentTemplateToForm,
  hasAssessmentTemplateOverwriteTargets,
} from './assessmentTemplateApply.utils';

const template: AssessmentTemplate = {
  id: 'tpl_00000000-0000-0000-0000-000000000001',
  name: 'API template',
  assessmentType: 'API',
  environment: 'Staging',
  description: 'Template description',
  scope: 'Template scope',
  archivedAt: null,
  createdAt: '2026-07-25T09:00:00.000Z',
  updatedAt: '2026-07-25T09:00:00.000Z',
};

describe('Assessment Template application', () => {
  it('copies only the approved four reusable fields', () => {
    const source = {
      ...createEmptyAssessmentFormValue(),
      name: 'Keep assessment name',
      applicationName: 'Keep application',
      status: 'draft' as const,
    };

    const result = applyAssessmentTemplateToForm(source, template);

    expect(result).toMatchObject({
      name: source.name,
      applicationName: source.applicationName,
      status: source.status,
      typeMode: 'preset',
      presetType: 'API',
      customType: '',
      environment: template.environment,
      description: template.description,
      scope: template.scope,
    });
  });

  it('maps custom types without overwriting unrelated fields', () => {
    const source = {
      ...createEmptyAssessmentFormValue(),
      name: 'Keep me',
      applicationName: 'Keep application',
    };
    const result = applyAssessmentTemplateToForm(source, {
      ...template,
      assessmentType: 'Cloud configuration review',
    });

    expect(result.typeMode).toBe('custom');
    expect(result.customType).toBe('Cloud configuration review');
    expect(result.name).toBe(source.name);
  });

  it('requires overwrite confirmation only when target fields have values', () => {
    expect(
      hasAssessmentTemplateOverwriteTargets(createEmptyAssessmentFormValue()),
    ).toBe(false);
    expect(
      hasAssessmentTemplateOverwriteTargets({
        ...createEmptyAssessmentFormValue(),
        scope: 'Existing scope',
      }),
    ).toBe(true);
  });
});

import {
  assessmentPresetTypes,
  type AssessmentFormValue,
  type AssessmentPresetType,
} from '~/app/components/appsec/assessmentForm';
import type { AssessmentTemplate } from '~/domain';

export const hasAssessmentTemplateOverwriteTargets = (
  value: AssessmentFormValue,
): boolean =>
  value.environment.trim().length > 0 ||
  value.description.trim().length > 0 ||
  value.scope.trim().length > 0 ||
  value.typeMode === 'custom' ||
  value.presetType !== assessmentPresetTypes[0];

export const applyAssessmentTemplateToForm = (
  value: AssessmentFormValue,
  template: AssessmentTemplate,
): AssessmentFormValue => {
  const isPreset = assessmentPresetTypes.includes(
    template.assessmentType as AssessmentPresetType,
  );

  return {
    ...value,
    typeMode: isPreset ? 'preset' : 'custom',
    presetType: isPreset
      ? (template.assessmentType as AssessmentPresetType)
      : value.presetType,
    customType: isPreset ? '' : template.assessmentType,
    environment: template.environment,
    description: template.description ?? '',
    scope: template.scope ?? '',
  };
};

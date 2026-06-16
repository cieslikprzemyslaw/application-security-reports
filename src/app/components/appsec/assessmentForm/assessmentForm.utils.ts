import type { AssessmentCreateInput, AssessmentUpdateInput } from '~/services';

import type {
  AssessmentFormFieldName,
  AssessmentFormValue,
  AssessmentPresetType,
} from './assessmentForm.type';
import { assessmentPresetTypes } from './assessmentForm.type';

export const createEmptyAssessmentFormValue = (): AssessmentFormValue => ({
  name: '',
  typeMode: 'preset',
  presetType: assessmentPresetTypes[0],
  customType: '',
  description: '',
  scope: '',
  status: 'draft',
});

const normalize = (value: string | undefined | null) => value?.trim() ?? '';

const resolveAssessmentType = (value: AssessmentFormValue) =>
  value.typeMode === 'custom'
    ? normalize(value.customType)
    : normalize(value.presetType);

type AssessmentFormSource = {
  name?: string;
  title?: string;
  type?: string;
  assessmentType?: string;
  description?: string;
  scope?: string;
  status: AssessmentFormValue['status'];
};

export const assessmentToFormValue = (
  assessment: AssessmentFormSource,
): AssessmentFormValue => {
  const assessmentType = normalize(
    assessment.assessmentType ?? assessment.type ?? '',
  );
  const presetType = assessmentPresetTypes.includes(
    assessmentType as AssessmentPresetType,
  )
    ? (assessmentType as AssessmentPresetType)
    : assessmentPresetTypes[0];

  return {
    name: normalize(assessment.name ?? assessment.title),
    typeMode: assessmentPresetTypes.includes(
      assessmentType as AssessmentPresetType,
    )
      ? 'preset'
      : 'custom',
    presetType,
    customType: assessmentPresetTypes.includes(
      assessmentType as AssessmentPresetType,
    )
      ? ''
      : assessmentType,
    description: normalize(assessment.description ?? ''),
    scope: normalize(assessment.scope ?? ''),
    status: assessment.status,
  };
};

export const areAssessmentFormValuesEqual = (
  first: AssessmentFormValue,
  second: AssessmentFormValue,
) =>
  first.name.trim() === second.name.trim() &&
  first.typeMode === second.typeMode &&
  first.presetType === second.presetType &&
  first.customType.trim() === second.customType.trim() &&
  first.description.trim() === second.description.trim() &&
  first.scope.trim() === second.scope.trim() &&
  first.status === second.status;

export const assessmentFormValueToCreateInput = (
  companyId: string,
  value: AssessmentFormValue,
): AssessmentCreateInput => ({
  companyId,
  title: normalize(value.name),
  description: normalize(value.description) || undefined,
  scope: normalize(value.scope) || undefined,
  status: 'draft',
  assessmentType: resolveAssessmentType(value) || undefined,
});

export const assessmentFormValueToUpdateInput = (
  value: AssessmentFormValue,
): AssessmentUpdateInput => ({
  title: normalize(value.name),
  description: normalize(value.description) || undefined,
  scope: normalize(value.scope) || undefined,
  status: value.status,
  assessmentType: resolveAssessmentType(value) || undefined,
});

export const validateAssessmentFormValue = (
  value: AssessmentFormValue,
  mode: 'create' | 'edit',
): Partial<Record<AssessmentFormFieldName, string>> => {
  const errors: Partial<Record<AssessmentFormFieldName, string>> = {};

  if (normalize(value.name).length === 0) {
    errors.name = 'Assessment name is required.';
  }

  if (value.typeMode === 'custom' && normalize(value.customType).length === 0) {
    errors.customType = 'Custom type is required when custom is selected.';
  }

  if (mode === 'edit' && normalize(value.status).length === 0) {
    errors.status = 'Choose a status.';
  }

  return errors;
};

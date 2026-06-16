import type { ThreatFormValue } from '~/app/components/appsec/threatForm';
import type { ValidationFieldError } from '~/validation';

export type ThreatFormErrors = Partial<Record<keyof ThreatFormValue, string>>;
export interface ThreatValidationErrorMap {
  fieldErrors: ThreatFormErrors;
  generalErrors: string[];
}

const threatFieldAliases: Record<string, keyof ThreatFormValue> = {
  title: 'title',
  owaspCategoryCode: 'owaspCategoryCode',
  customCategory: 'customCategory',
  strideCategories: 'owaspCategoryCode',
  description: 'observation',
  observation: 'observation',
  reproductionSteps: 'observation',
  affectedComponent: 'affectedComponent',
  affectedEndpoint: 'affectedEndpoint',
  impact: 'risk',
  risk: 'risk',
  recommendation: 'recommendation',
  remediation: 'recommendation',
  references: 'references',
  status: 'status',
  resolutionNote: 'resolutionNote',
  acceptedRiskJustification: 'acceptedRiskJustification',
};

const isThreatFormReadyForOpen = (value: ThreatFormValue) =>
  value.title.trim().length > 0 &&
  Boolean(value.owaspCategoryCode?.trim().length) &&
  (value.owaspCategoryCode !== 'custom' ||
    (value.customCategory ?? '').trim().length > 0) &&
  value.affectedComponent.trim().length > 0 &&
  value.observation.trim().length > 0 &&
  value.risk.trim().length > 0 &&
  value.recommendation.trim().length > 0 &&
  value.references.trim().length > 0;

export const getThreatValidationErrors = (
  value: ThreatFormValue,
): ThreatFormErrors => {
  const errors: ThreatFormErrors = {};

  if (value.title.trim().length === 0) {
    errors.title = 'Title is required.';
  }

  if (!value.owaspCategoryCode?.trim()) {
    errors.owaspCategoryCode = 'OWASP category code is required.';
  }

  if (value.owaspCategoryCode === 'custom' && !value.customCategory?.trim()) {
    errors.customCategory = 'Custom category is required.';
  }

  if (value.status !== 'draft' && !isThreatFormReadyForOpen(value)) {
    if (value.affectedComponent.trim().length === 0) {
      errors.affectedComponent = 'Affected component is required.';
    }

    if (value.observation.trim().length === 0) {
      errors.observation = 'Reproduction steps are required.';
    }

    if (value.risk.trim().length === 0) {
      errors.risk = 'Impact is required.';
    }

    if (value.recommendation.trim().length === 0) {
      errors.recommendation = 'Remediation is required.';
    }

    if (value.references.trim().length === 0) {
      errors.references = 'References are required.';
    }
  }

  if (
    value.status === 'resolved' &&
    value.resolutionNote?.trim().length === 0
  ) {
    errors.resolutionNote = 'Resolution note is required.';
  }

  if (
    value.status === 'accepted-risk' &&
    value.acceptedRiskJustification?.trim().length === 0
  ) {
    errors.acceptedRiskJustification =
      'Accepted-risk justification is required.';
  }

  return errors;
};

export const createThreatValidationErrorMap = (
  details: ValidationFieldError[],
): ThreatValidationErrorMap => {
  const fieldErrors: ThreatFormErrors = {};
  const generalErrors: string[] = [];

  for (const detail of details) {
    const path = detail.path.trim();
    const fieldName = threatFieldAliases[path.split('.')[0] ?? ''];

    if (fieldName && !fieldErrors[fieldName]) {
      fieldErrors[fieldName] = detail.message;
      continue;
    }

    generalErrors.push(detail.message);
  }

  return {
    fieldErrors,
    generalErrors,
  };
};

export const areThreatFormValuesEqual = (
  left: ThreatFormValue,
  right: ThreatFormValue,
) => JSON.stringify(left) === JSON.stringify(right);

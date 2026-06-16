import type { ThreatFormValue } from '~/app/components/appsec/threatForm';

export type ThreatFormErrors = Partial<Record<keyof ThreatFormValue, string>>;

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

export const areThreatFormValuesEqual = (
  left: ThreatFormValue,
  right: ThreatFormValue,
) => JSON.stringify(left) === JSON.stringify(right);

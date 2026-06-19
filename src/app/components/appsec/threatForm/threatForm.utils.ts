import { getOwaspTop10CategoryOptions, type OwaspTop10Option } from '~/domain';

import type { ThreatFormValue } from './threatForm.type';

export const statusLabelMap: Record<ThreatFormValue['status'], string> = {
  draft: 'Draft',
  open: 'Open',
  resolved: 'Resolved',
  'accepted-risk': 'Accepted Risk',
  'in-review': 'In Review',
  mitigated: 'Mitigated',
  'false-positive': 'False Positive',
};

export const fieldIdMap: Record<keyof ThreatFormValue, string> = {
  title: 'threat-title',
  owaspCategoryCode: 'threat-owasp-category-code',
  customCategory: 'threat-custom-category',
  strideCategory: 'threat-stride-category',
  severity: 'threat-severity',
  status: 'threat-status',
  affectedComponent: 'threat-affected-component',
  affectedEndpoint: 'threat-affected-endpoint',
  observation: 'threat-observation',
  reproductionSteps: 'threat-reproduction-steps',
  risk: 'threat-risk',
  recommendation: 'threat-remediation',
  references: 'threat-references',
  resolutionNote: 'threat-resolution-note',
  acceptedRiskJustification: 'threat-accepted-risk-justification',
};

const customCategoryOption: OwaspTop10Option = {
  label: 'Custom',
  value: 'custom',
};

const createHistoricalCategoryOption = (value: string): OwaspTop10Option => ({
  label: value,
  value,
});

export const buildOwaspCategoryOptions = (
  owaspTaxonomyVersion: string,
  currentValue?: string,
): OwaspTop10Option[] => {
  const options = getOwaspTop10CategoryOptions(owaspTaxonomyVersion);
  const normalizedValue = currentValue?.trim();

  if (!normalizedValue || normalizedValue === 'custom') {
    return [...options, customCategoryOption];
  }

  const hasHistoricalValue = options.some(
    option => option.value === normalizedValue,
  );

  return hasHistoricalValue
    ? [...options, customCategoryOption]
    : [
        createHistoricalCategoryOption(normalizedValue),
        ...options,
        customCategoryOption,
      ];
};

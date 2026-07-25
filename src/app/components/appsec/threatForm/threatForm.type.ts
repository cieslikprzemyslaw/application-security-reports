import type { FormEvent } from 'react';

import type {
  CweCatalogVersion,
  OwaspTop10Version,
  Severity,
  ThreatStatus,
  StrideCategory,
} from '~/domain';

export type { StrideCategory } from '~/domain';

export interface ThreatFormValue {
  title: string;
  cweIds?: string[];
  owaspCategoryCode?: string;
  customCategory?: string;
  strideCategory?: StrideCategory;
  severity: Severity;
  status: ThreatStatus;
  affectedComponent: string;
  affectedEndpoint: string;
  observation: string;
  reproductionSteps?: string;
  risk: string;
  recommendation: string;
  references: string;
  resolutionNote?: string;
  acceptedRiskJustification?: string;
}

export interface ThreatFormProps {
  value: ThreatFormValue;
  owaspTaxonomyVersion: OwaspTop10Version;
  cweCatalogVersion?: CweCatalogVersion;
  errors?: Partial<Record<keyof ThreatFormValue, string>>;
  isSubmitting?: boolean;
  focusField?: keyof ThreatFormValue;
  submitLabel?: string;
  onChange: (value: ThreatFormValue) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

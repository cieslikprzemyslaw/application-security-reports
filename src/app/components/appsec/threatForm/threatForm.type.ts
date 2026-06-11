import type { FormEvent } from 'react';

import type { Severity, ThreatStatus, StrideCategory } from '~/domain';

export type { StrideCategory } from '~/domain';

export interface ThreatFormValue {
  title: string;
  strideCategory: StrideCategory;
  severity: Severity;
  status: ThreatStatus;
  affectedComponent: string;
  affectedEndpoint: string;
  observation: string;
  risk: string;
  recommendation: string;
  references: string;
}

export interface ThreatFormProps {
  value: ThreatFormValue;
  errors?: Partial<Record<keyof ThreatFormValue, string>>;
  isSubmitting?: boolean;
  submitLabel?: string;
  onChange: (value: ThreatFormValue) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

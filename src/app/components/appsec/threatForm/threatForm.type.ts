import type { FormEvent } from 'react';

import type { Severity } from '~/app/components/ui/severityBadge';
import type { ThreatStatus } from '~/app/components/ui/statusBadge';

export type StrideCategory =
  | 'Spoofing'
  | 'Tampering'
  | 'Repudiation'
  | 'Information Disclosure'
  | 'Denial of Service'
  | 'Elevation of Privilege';

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

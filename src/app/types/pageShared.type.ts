import type { ReactNode } from 'react';

export type {
  AssessmentStatus,
  Severity,
  ThreatStatus,
} from '~/domain';

export interface SelectOption {
  label: string;
  value: string;
}

export interface HeaderAction {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
}

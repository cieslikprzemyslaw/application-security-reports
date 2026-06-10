import type { ReactNode } from 'react';

export type RiskLevel =
  | 'Critical'
  | 'High'
  | 'Medium'
  | 'Low'
  | 'Informational';

export type AssessmentStatus =
  | 'Draft'
  | 'In Progress'
  | 'In Review'
  | 'Completed'
  | 'Retest Required';

export type ThreatStatus =
  | 'Open'
  | 'In Progress'
  | 'Resolved'
  | 'Retest Required'
  | 'Accepted Risk';

export interface SelectOption {
  label: string;
  value: string;
}

export interface HeaderAction {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
}

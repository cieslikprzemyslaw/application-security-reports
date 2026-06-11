import type { HTMLAttributes, ReactNode } from 'react';

import type { AssessmentStatus, Severity } from '~/domain';

export interface AssessmentMetadataItem {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
}

export interface AssessmentSummaryProps extends HTMLAttributes<HTMLElement> {
  companyName: string;
  companyLogo?: ReactNode;
  applicationName: string;
  assessmentId: string;
  environment: string;
  dateRange: string;
  testerName: string;
  overallRisk: Severity;
  status: AssessmentStatus;
  metadata?: AssessmentMetadataItem[];
}

import type { HTMLAttributes, ReactNode } from 'react';

import type { Severity } from '~/app/components/ui/severityBadge';
import type { ThreatStatus } from '~/app/components/ui/statusBadge';

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
  status: ThreatStatus;
  metadata?: AssessmentMetadataItem[];
}

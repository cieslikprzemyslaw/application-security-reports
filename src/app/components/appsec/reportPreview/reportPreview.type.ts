import type { HTMLAttributes, ReactNode } from 'react';

import type { Severity } from '~/app/components/ui/severityBadge';

export interface ReportThreat {
  id: string;
  title: string;
  severity: Severity;
  observation: string;
  risk: string;
  recommendation: string;
  evidence?: ReactNode;
}

export interface ReportPreviewProps extends HTMLAttributes<HTMLElement> {
  header: ReactNode;
  executiveSummary: string;
  riskSummary: ReactNode;
  threats: ReportThreat[];
  footer?: ReactNode;
}

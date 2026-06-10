import type { HTMLAttributes } from 'react';

import type { Severity } from '~/app/components/ui/severityBadge';

export interface SeverityCount {
  severity: Severity;
  count: number;
}

export interface RiskSummaryProps extends HTMLAttributes<HTMLDivElement> {
  overallRisk: Severity;
  totalFindings: number;
  openThreats: number;
  retestRequired: number;
  severityCounts: SeverityCount[];
}

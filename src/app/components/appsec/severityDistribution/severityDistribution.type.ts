import type { HTMLAttributes } from 'react';

import type { Severity } from '~/app/components/ui/severityBadge';

export interface SeverityDistributionItem {
  severity: Severity;
  count: number;
}

export interface SeverityDistributionProps extends HTMLAttributes<HTMLDivElement> {
  items: SeverityDistributionItem[];
  showTotal?: boolean;
}

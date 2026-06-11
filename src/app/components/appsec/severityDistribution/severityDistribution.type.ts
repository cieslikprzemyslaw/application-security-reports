import type { HTMLAttributes } from 'react';

import type { Severity } from '~/domain';

export interface SeverityDistributionItem {
  severity: Severity;
  count: number;
}

export interface SeverityDistributionProps extends HTMLAttributes<HTMLDivElement> {
  items: SeverityDistributionItem[];
  showTotal?: boolean;
}

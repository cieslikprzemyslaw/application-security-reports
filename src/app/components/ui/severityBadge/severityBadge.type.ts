import type { HTMLAttributes } from 'react';

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';

export type SeverityBadgeSize = 'small' | 'medium';

export interface SeverityBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  severity: Severity;
  size?: SeverityBadgeSize;
  showDot?: boolean;
}

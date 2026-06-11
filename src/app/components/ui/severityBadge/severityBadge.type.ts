import type { HTMLAttributes } from 'react';

import type { Severity } from '~/domain';

export type { Severity } from '~/domain';

export type SeverityBadgeSize = 'small' | 'medium';

export interface SeverityBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  severity: Severity;
  size?: SeverityBadgeSize;
  showDot?: boolean;
}

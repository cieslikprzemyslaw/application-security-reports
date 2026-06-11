import type { HTMLAttributes } from 'react';

import type { ThreatStatus } from '~/domain';

export type { ThreatStatus } from '~/domain';

export type StatusBadgeSize = 'small' | 'medium';

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: ThreatStatus;
  size?: StatusBadgeSize;
}

export interface StatusBadgeStyledProps {
  $status: ThreatStatus;
  $size: StatusBadgeSize;
}

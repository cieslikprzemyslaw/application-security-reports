import type { HTMLAttributes } from 'react';

export type ThreatStatus =
  | 'Open'
  | 'In Progress'
  | 'Resolved'
  | 'Retest Required'
  | 'Accepted Risk';

export type StatusBadgeSize = 'small' | 'medium';

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: ThreatStatus;
  size?: StatusBadgeSize;
}

export interface StatusBadgeStyledProps {
  $status: ThreatStatus;
  $size: StatusBadgeSize;
}

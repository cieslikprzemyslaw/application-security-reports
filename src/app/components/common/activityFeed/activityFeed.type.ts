import type { HTMLAttributes, ReactNode } from 'react';

export type ActivityTone =
  | 'brand'
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral';

export interface ActivityItem {
  id: string;
  title: ReactNode;
  meta?: ReactNode;
  icon?: ReactNode;
  tone?: ActivityTone;
}

export interface ActivityFeedProps extends HTMLAttributes<HTMLDivElement> {
  items: ActivityItem[];
  emptyState?: ReactNode;
}

export interface ActivityFeedIconStyledProps {
  $tone: ActivityTone;
}

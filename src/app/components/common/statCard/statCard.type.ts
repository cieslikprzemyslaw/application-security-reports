import type { HTMLAttributes, ReactNode } from 'react';

export type StatTrendDirection = 'up' | 'down' | 'equal';

export type StatTrendTone = 'positive' | 'negative' | 'neutral';

export type StatIconTone =
  | 'brand'
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'informational'
  | 'purple'
  | 'neutral';

export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  icon?: ReactNode;
  iconTone?: StatIconTone;
  helperText?: string;
  trendDirection?: StatTrendDirection;
  trendTone?: StatTrendTone;
  trendValue?: string;
}

export interface StatCardIconStyledProps {
  $tone: StatIconTone;
}

export interface StatTrendValueStyledProps {
  $tone: StatTrendTone;
}

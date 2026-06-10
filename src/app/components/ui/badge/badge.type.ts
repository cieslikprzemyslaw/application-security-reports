import type { HTMLAttributes, ReactNode } from 'react';

export type BadgeVariant =
  | 'neutral'
  | 'brand'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

export type BadgeSize = 'small' | 'medium';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  label: string;
  icon?: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  showDot?: boolean;
}

export interface BadgeStyledProps {
  $variant: BadgeVariant;
  $size: BadgeSize;
}

import type { HTMLAttributes, ReactNode } from 'react';

export type CalloutVariant =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral';

export interface CalloutProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  children: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  dismissLabel?: string;
  onDismiss?: () => void;
  variant?: CalloutVariant;
}

export interface CalloutStyledProps {
  $variant: CalloutVariant;
}

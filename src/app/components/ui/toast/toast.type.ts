import type { HTMLAttributes, ReactNode } from 'react';

export type ToastVariant = 'success' | 'warning' | 'error' | 'info';

export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  variant?: ToastVariant;
  dismissLabel?: string;
  onDismiss?: () => void;
}

export interface ToastStyledProps {
  $variant: ToastVariant;
}

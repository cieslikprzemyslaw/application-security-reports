import type { HTMLAttributes, ReactNode } from 'react';

export type EmptyStateVariant = 'first-use' | 'no-results' | 'unavailable';

export interface EmptyStateProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'title'
> {
  variant?: EmptyStateVariant;
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
}

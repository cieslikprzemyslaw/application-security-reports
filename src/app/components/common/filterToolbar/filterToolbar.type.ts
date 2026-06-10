import type { HTMLAttributes, ReactNode } from 'react';

export interface FilterToolbarProps extends HTMLAttributes<HTMLDivElement> {
  filters?: ReactNode;
  search?: ReactNode;
  actions?: ReactNode;
  summary?: ReactNode;
}

import type { HTMLAttributes, ReactNode } from 'react';

export interface TableFooterProps extends HTMLAttributes<HTMLDivElement> {
  summary?: ReactNode;
  pagination?: ReactNode;
  actions?: ReactNode;
}

import type { HTMLAttributes, ReactNode } from 'react';

export interface SectionHeaderProps extends HTMLAttributes<HTMLElement> {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

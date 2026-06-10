import type { HTMLAttributes, ReactNode } from 'react';

export interface PageContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  maxWidth?: 'default' | 'wide' | 'report' | 'full';
  spacing?: 'compact' | 'default' | 'comfortable';
}

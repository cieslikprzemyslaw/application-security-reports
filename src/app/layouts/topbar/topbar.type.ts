import type { HTMLAttributes, ReactNode } from 'react';

export interface TopbarProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  menuButton?: ReactNode;
  search?: ReactNode;
  actions?: ReactNode;
  userMenu?: ReactNode;
}

import type { HTMLAttributes, ReactNode } from 'react';

export interface TopbarProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  onMenuClick?: () => void;
  menuButtonControls?: string;
  menuButtonExpanded?: boolean;
  search?: ReactNode;
  actions?: ReactNode;
  userMenu?: ReactNode;
}

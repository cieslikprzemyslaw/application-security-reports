import type { HTMLAttributes, ReactNode, Ref } from 'react';

export interface TopbarProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  onMenuClick?: () => void;
  menuButtonControls?: string;
  menuButtonExpanded?: boolean;
  menuButtonRef?: Ref<HTMLButtonElement>;
  search?: ReactNode;
  actions?: ReactNode;
  userMenu?: ReactNode;
}

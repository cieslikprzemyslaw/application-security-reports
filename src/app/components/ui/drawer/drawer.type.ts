import type { ReactNode } from 'react';

export type DrawerSize = 'small' | 'medium' | 'large';

export interface DrawerProps {
  isOpen: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: DrawerSize;
  closeLabel?: string;
  onClose: () => void;
}

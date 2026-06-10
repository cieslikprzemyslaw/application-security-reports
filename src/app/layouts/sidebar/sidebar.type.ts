import type { HTMLAttributes, ReactNode } from 'react';

export interface SidebarNavigationItem {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: ReactNode;
  href?: string;
  isActive?: boolean;
  onClick?: () => void;
}

export interface SidebarNavigationGroup {
  id: string;
  label?: string;
  items: SidebarNavigationItem[];
}

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  brand: ReactNode;
  navigationGroups: SidebarNavigationGroup[];
  footer?: ReactNode;
  ariaLabel?: string;
}

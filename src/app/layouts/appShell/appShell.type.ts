import type { HTMLAttributes, ReactNode } from 'react';

export interface AppShellProps extends HTMLAttributes<HTMLDivElement> {
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
  isSidebarOpen?: boolean;
  onSidebarClose?: () => void;
}

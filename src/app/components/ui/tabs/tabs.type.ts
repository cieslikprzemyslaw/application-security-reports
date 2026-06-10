import type { ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  activeTabId: string;
  onChange: (tabId: string) => void;
  ariaLabel: string;
}

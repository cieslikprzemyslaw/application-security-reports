import type { ReactNode } from 'react';

export interface TabItem<TTabId extends string = string> {
  id: TTabId;
  label: string;
  content: ReactNode;
  disabled?: boolean;
  count?: number;
}

export interface TabsProps<TTabId extends string = string> {
  items: TabItem<TTabId>[];
  activeTabId: TTabId;
  onChange: (tabId: TTabId) => void;
  ariaLabel: string;
}

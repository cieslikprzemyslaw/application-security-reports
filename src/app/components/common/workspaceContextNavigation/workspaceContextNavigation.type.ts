import type { To } from 'react-router-dom';

export interface WorkspaceContextItem {
  label: string;
  href?: To;
  onClick?: () => void;
}

export interface WorkspaceContextNavigationProps {
  items: WorkspaceContextItem[];
  ariaLabel?: string;
  documentTitle?: string;
}

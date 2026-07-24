import type { HTMLAttributes, ReactNode, Ref } from 'react';

import type { PageActionItem } from '../pageActionGroup';
import type { WorkspaceContextItem } from '../workspaceContextNavigation';

export type BreadcrumbItem = WorkspaceContextItem;

export interface PageHeaderProps extends HTMLAttributes<HTMLElement> {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  context?: WorkspaceContextItem[];
  documentTitle?: string;
  primaryAction?: PageActionItem;
  secondaryActions?: PageActionItem[];
  overflowActions?: PageActionItem[];
  destructiveAction?: PageActionItem;
  titleRef?: Ref<HTMLHeadingElement>;
  titleId?: string;
}

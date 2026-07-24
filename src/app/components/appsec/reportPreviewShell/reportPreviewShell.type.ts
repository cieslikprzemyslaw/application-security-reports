import type { ReactNode, Ref } from 'react';

import type { ReportActionsProps } from '~/app/components/appsec/reportActions';
import type { WorkspaceContextItem } from '~/app/components/common';

export type ReportPreviewShellTab = 'preview' | 'data';

export interface ReportPreviewShellActionStatus {
  message: string;
  role?: 'status' | 'alert';
}

export interface ReportPreviewShellProps {
  applicationName: string;
  assessmentCode: string;
  autoSaved?: boolean;
  preview: ReactNode;
  dataView?: ReactNode;
  readiness?: ReactNode;
  activeTab?: ReportPreviewShellTab;
  onActiveTabChange?: (tab: ReportPreviewShellTab) => void;
  previewTabRef?: Ref<HTMLButtonElement>;
  titleRef?: Ref<HTMLHeadingElement>;
  reportActions?: ReportActionsProps;
  reportActionStatus?: ReportPreviewShellActionStatus;
  context?: WorkspaceContextItem[];
  documentTitle?: string;
}

import type { ReactNode, Ref } from 'react';

export type ReportPreviewShellTab = 'preview' | 'data';

export interface ReportPreviewShellProps {
  applicationName: string;
  assessmentCode: string;
  autoSaved?: boolean;
  preview: ReactNode;
  dataView?: ReactNode;
  activeTab?: ReportPreviewShellTab;
  onActiveTabChange?: (tab: ReportPreviewShellTab) => void;
  previewTabRef?: Ref<HTMLButtonElement>;
  titleRef?: Ref<HTMLHeadingElement>;
  onPrint?: () => void;
  onDownloadPdf?: () => void;
}

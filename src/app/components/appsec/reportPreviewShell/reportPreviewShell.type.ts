import type { ReactNode } from 'react';

export interface ReportPreviewShellProps {
  applicationName: string;
  assessmentCode: string;
  autoSaved?: boolean;
  selectionView?: ReactNode;
  preview: ReactNode;
  dataView?: ReactNode;
  onPrint?: () => void;
  onDownloadPdf?: () => void;
}

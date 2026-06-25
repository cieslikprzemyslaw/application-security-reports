import type { HTMLAttributes } from 'react';

export interface ReportActionsProps extends HTMLAttributes<HTMLDivElement> {
  isGenerating?: boolean;
  onPreview?: () => void;
  onPrint?: () => void;
  onGeneratePdf?: () => void;
  onDownloadMarkdown?: () => void;
}

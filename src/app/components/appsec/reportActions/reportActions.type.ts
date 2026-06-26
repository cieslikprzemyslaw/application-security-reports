import type { HTMLAttributes } from 'react';

export type ReportActionName =
  | 'backToEditor'
  | 'generatePreview'
  | 'saveDraft'
  | 'saveAsFinal'
  | 'generatePdf';

export interface ReportActionConfig {
  onActivate: () => void;
  isPending?: boolean;
  isDisabled?: boolean;
  disabledReason?: string;
}

export interface ReportActionsProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  backToEditor?: ReportActionConfig;
  generatePreview?: ReportActionConfig;
  saveDraft?: ReportActionConfig;
  saveAsFinal?: ReportActionConfig;
  generatePdf?: ReportActionConfig;
  primaryAction?: ReportActionName;
}

export interface ReportDetailsProps {
  reportId: string;
  versionId?: string;
  onPrint?: () => void;
  onDownloadPdf?: () => void;
}

export interface ReportDetailsProps {
  companyId: string;
  reportId: string;
  versionId?: string;
  onPrint?: () => void;
  onDownloadPdf?: () => void;
}

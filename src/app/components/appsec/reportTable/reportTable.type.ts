export interface ReportTableRow {
  id: string;
  companyName: string;
  assessmentName: string;
  reportType: string;
  status: string;
  generatedAt?: string;
  updatedAt: string;
}

export interface ReportTableProps {
  reports: ReportTableRow[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  onReportClick?: (report: ReportTableRow) => void;
}

import type { ReportCoverProps } from '~/app/components/appsec/reportCover';

export interface ReportDetailsProps {
  cover: ReportCoverProps;
  autoSaved?: boolean;
  onPrint?: () => void;
  onDownloadPdf?: () => void;
}

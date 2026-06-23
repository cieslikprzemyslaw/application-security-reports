import type { ReactNode } from 'react';

import type { ReportCoverProps } from '~/app/components/appsec/reportCover';

export interface ReportsProps {
  cover?: ReportCoverProps;
  selectionView?: ReactNode;
  dataView?: ReactNode;
  autoSaved?: boolean;
  onPrint?: () => void;
  onDownloadPdf?: () => void;
}

import React from 'react';

import Reports from '~/app/pages/reports';

import type { ReportDetailsProps } from './reportDetails.type';

const ReportDetails = ({
  cover,
  autoSaved,
  onPrint,
  onDownloadPdf,
}: ReportDetailsProps) => (
  <Reports
    cover={cover}
    autoSaved={autoSaved}
    onPrint={onPrint}
    onDownloadPdf={onDownloadPdf}
  />
);

export default ReportDetails;

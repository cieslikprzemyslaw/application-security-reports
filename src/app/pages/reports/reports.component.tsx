import React from 'react';

import ReportCover from '~/app/components/appsec/reportCover';
import ReportPreviewShell from '~/app/components/appsec/reportPreviewShell';

import type { ReportsProps } from './reports.type';
import type { ReportCoverProps } from '~/app/components/appsec/reportCover';

const fallbackCover: ReportCoverProps = {
  companyName: 'Company name',
  companyWebsite: 'company.example',
  reportId: 'REPORT-DRAFT',
  issuedDate: 'Draft',
  applicationName: 'Application name',
  environment: 'Environment',
  engagementDate: 'Not specified',
  testerName: 'Not assigned',
  methodology: 'OWASP ASVS / WSTG',
  findingsCount: 0,
  overallRisk: 'Informational',
  executiveSummary: 'Add assessment data to generate the report preview.',
  scope: [],
  findings: [],
  confidential: true,
};

const Reports = ({
  cover = fallbackCover,
  dataView,
  autoSaved = true,
  onPrint,
  onDownloadPdf,
}: ReportsProps) => (
  <ReportPreviewShell
    applicationName={cover.applicationName}
    assessmentCode={cover.reportId}
    autoSaved={autoSaved}
    preview={<ReportCover {...cover} />}
    dataView={dataView ?? <pre>{JSON.stringify(cover, null, 2)}</pre>}
    onPrint={onPrint}
    onDownloadPdf={onDownloadPdf}
  />
);

export default Reports;

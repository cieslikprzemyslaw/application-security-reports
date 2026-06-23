import React from 'react';

import ReportCover from '~/app/components/appsec/reportCover';
import ReportPreviewShell from '~/app/components/appsec/reportPreviewShell';

import ReportBuilderTree from './reportBuilderTree.component';

import type { ReportCoverProps } from '~/app/components/appsec/reportCover';
import type { ReportsProps } from './reports.type';

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
  overallRisk: 'informational',
  executiveSummary: 'Add assessment data to generate the report preview.',
  scope: [],
  findings: [],
  confidential: true,
};

const Reports = ({
  cover = fallbackCover,
  companyId,
  companyName,
  dataView,
  autoSaved = true,
  onPrint,
  onDownloadPdf,
}: ReportsProps) => {
  const resolvedDataView =
    dataView ??
    (companyId ? (
      <ReportBuilderTree
        key={companyId}
        companyId={companyId}
        companyName={companyName ?? cover.companyName}
      />
    ) : (
      <pre>{JSON.stringify(cover, null, 2)}</pre>
    ));

  return (
    <ReportPreviewShell
      applicationName={cover.applicationName}
      assessmentCode={cover.reportId}
      autoSaved={autoSaved}
      preview={<ReportCover {...cover} />}
      dataView={resolvedDataView}
      onPrint={onPrint}
      onDownloadPdf={onDownloadPdf}
    />
  );
};

export default Reports;

import type { ReactNode } from 'react';

import ReportCover, {
  type ReportCoverProps,
} from '~/app/components/appsec/reportCover';
import ReportPreviewShell from '~/app/components/appsec/reportPreviewShell';

export const fallbackReportCover: ReportCoverProps = {
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

export interface ReportsShellProps {
  cover: ReportCoverProps;
  dataView: ReactNode;
  autoSaved: boolean;
}

const ReportsShell = ({ cover, dataView, autoSaved }: ReportsShellProps) => (
  <ReportPreviewShell
    applicationName={cover.applicationName}
    assessmentCode={cover.reportId}
    autoSaved={autoSaved}
    preview={<ReportCover {...cover} />}
    dataView={dataView}
  />
);

export default ReportsShell;

import type { ReactNode } from 'react';

import type { ReportPreviewEvidence, Severity, ThreatStatus } from '~/domain';

export interface ReportFinding {
  id: string;
  title: string;
  severity: Severity;
  status: ThreatStatus;
  affectedAsset: string;
  observation: string;
  risk: string;
  recommendation: string;
  evidence?: ReportPreviewEvidence[];
}

export interface ReportCoverProps {
  companyName: string;
  companyLogo?: ReactNode;
  companyWebsite: string;
  companyContactEmail?: string;
  reportId: string;
  issuedDate: string;
  applicationName: string;
  environment: string;
  engagementDate: string;
  testerName: string;
  methodology: string;
  findingsCount: number;
  overallRisk: Severity;
  executiveSummary: string;
  scope?: string[];
  findings?: ReportFinding[];
  footerText?: string;
  confidential?: boolean;
}

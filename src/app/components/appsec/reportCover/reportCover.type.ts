import type { ReactNode } from 'react';

import type { RiskLevel } from '~/app/types/pageShared.type';

export interface ReportFinding {
  id: string;
  title: string;
  severity: RiskLevel;
  status: string;
  affectedAsset: string;
  observation: string;
  risk: string;
  recommendation: string;
  evidence?: ReactNode;
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
  overallRisk: RiskLevel;
  executiveSummary: string;
  scope?: string[];
  findings?: ReportFinding[];
  footerText?: string;
  confidential?: boolean;
}

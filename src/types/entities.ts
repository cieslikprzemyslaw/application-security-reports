export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
export type ThreatStatus =
  | 'Open'
  | 'In Progress'
  | 'Resolved'
  | 'Retest Required'
  | 'Accepted Risk';
export interface Company {
  id: string;
  name: string;
  logoPath?: string;
  website?: string;
  contactEmail?: string;
  footerText?: string;
  createdAt: string;
  updatedAt: string;
}
export interface Assessment {
  id: string;
  companyId: string;
  title: string;
  applicationName: string;
  environment: string;
  assessmentType: string;
  status: string;
  overallRisk: Severity;
  createdAt: string;
  updatedAt: string;
}
export interface Threat {
  id: string;
  assessmentId: string;
  title: string;
  strideCategory: string;
  severity: Severity;
  status: ThreatStatus;
  affectedComponent?: string;
  affectedEndpoint?: string;
  observation: string;
  risk: string;
  recommendation: string;
  evidenceIds: string[];
  createdAt: string;
  updatedAt: string;
}

import type { Assessment } from './assessment.js';
import type { Company } from './company.js';
import type { Evidence } from './evidence.js';
import type { Report, ReportSnapshot } from './report.js';
import type { ReportBrandingMode } from './settings.js';
import type { Threat } from './threat.js';

export type ReportViewEvidence = Omit<Evidence, 'filePath'>;

export interface ReportViewFinding {
  threat: Threat;
  evidence: ReportViewEvidence[];
}

export interface ReportViewAssessment {
  assessment: Assessment;
  findings: ReportViewFinding[];
}

export interface ReportViewBranding {
  companyName: string;
  companyWebsite?: string;
  companyContactEmail?: string;
  companyLogoPath?: string;
  companyFooterText?: string;
  issuerName?: string;
  issuerContactName?: string;
  issuerContactEmail?: string;
  issuerLogoId?: string;
  reportFooterText?: string;
  reportConfidentialityLabel?: string;
  confidentialReports?: boolean;
  allowedBrandingModes?: ReportBrandingMode[];
  defaultBrandingMode?: ReportBrandingMode;
}

export interface ReportViewConfiguration {
  methodology?: string;
  reportStyle?: string;
  includeEvidence?: boolean;
}

export interface ReportView {
  report: Report;
  company: Company;
  assessments: ReportViewAssessment[];
  branding: ReportViewBranding;
  configuration: ReportViewConfiguration;
  snapshot: ReportSnapshot;
}

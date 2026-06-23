import type { Assessment } from './assessment.js';
import type { Company } from './company.js';
import type { Severity } from './common.js';
import type { Evidence } from './evidence.js';
import type { ReportBrandingMode } from './settings.js';
import type { Threat } from './threat.js';

export interface ReportPreviewSelection {
  threatIds: string[];
  evidenceIds: string[];
}

export interface ReportPreviewConfiguration {
  methodology?: string;
  reportStyle?: string;
  includeEvidence?: boolean;
}

export interface ReportPreviewRequest {
  companyId: string;
  assessmentId: string;
  selection: ReportPreviewSelection;
  configuration: ReportPreviewConfiguration;
  brandingMode: ReportBrandingMode;
}

export type ReportPreviewCompany = Omit<
  Company,
  'createdAt' | 'updatedAt' | 'archivedAt'
>;

export type ReportPreviewAssessment = Omit<
  Assessment,
  'createdAt' | 'updatedAt'
>;

export type ReportPreviewThreat = Omit<Threat, 'createdAt' | 'updatedAt'>;

export type ReportPreviewEvidence = Omit<
  Evidence,
  'createdAt' | 'updatedAt' | 'filePath' | 'storageKey'
>;

export interface ReportPreviewBranding {
  brandingMode: ReportBrandingMode;
  companyName: string;
  companyWebsite?: string;
  companyContactEmail?: string;
  companyLogoUrl?: string | null;
  companyFooterText?: string;
  issuerName?: string;
  issuerContactName?: string;
  issuerContactEmail?: string;
  issuerLogoUrl?: string | null;
  reportFooterText?: string;
  reportConfidentialityLabel?: string;
  confidentialReports?: boolean;
  allowedBrandingModes?: ReportBrandingMode[];
  defaultBrandingMode?: ReportBrandingMode;
}

export interface ReportPreviewRiskSummary {
  overallRisk?: Severity;
  threatCount: number;
  evidenceCount: number;
}

export interface ReportPreviewSnapshot {
  company: ReportPreviewCompany;
  assessment: ReportPreviewAssessment;
  selection: ReportPreviewSelection;
  configuration: ReportPreviewConfiguration;
  branding: ReportPreviewBranding;
  selectedThreats: ReportPreviewThreat[];
  selectedEvidence: ReportPreviewEvidence[];
  riskSummary: ReportPreviewRiskSummary;
  warnings: string[];
}

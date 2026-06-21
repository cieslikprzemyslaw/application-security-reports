import type {
  AssessmentId,
  ISODateString,
  ReportId,
  ReportStatus,
  ReportVersionId,
  ReportVersionStatus,
  Severity,
  StrideCategory,
  ThreatId,
  ThreatStatus,
  TimestampedEntity,
} from './common.js';
import type { ReportBrandingMode } from './settings.js';

export interface Report extends TimestampedEntity {
  id: ReportId;
  assessmentId: AssessmentId;
  title: string;
  status: ReportStatus;
  selectedThreatIds: ThreatId[];
  latestVersion: number;
  executiveSummary?: string;
}

export interface ReportThreatSnapshot {
  threatId: ThreatId;
  title: string;
  description: string;
  severity: Severity;
  status: ThreatStatus;
  strideCategories: StrideCategory[];
  affectedAsset?: string;
  impact?: string;
  recommendation?: string;
}

export interface ReportSnapshotBranding {
  brandingMode?: ReportBrandingMode;
  issuerName?: string;
  issuerContactName?: string;
  issuerContactEmail?: string;
  issuerLogoId?: string;
  clientName: string;
  clientWebsite?: string;
  clientContactEmail?: string;
  clientFooterText?: string;
  reportFooterText?: string;
  confidentialityLabel?: string;
  confidentialReports?: boolean;
}

export interface ReportSnapshot {
  reportTitle: string;
  companyName: string;
  assessmentTitle: string;
  executiveSummary?: string;
  branding: ReportSnapshotBranding;
  threats: ReportThreatSnapshot[];
}

export interface ReportVersion {
  id: ReportVersionId;
  reportId: ReportId;
  version: number;
  status: ReportVersionStatus;
  generatedAt: ISODateString;
  filePath?: string;
  snapshot: ReportSnapshot;
}

export type CreateReportVersionInput = Omit<ReportVersion, 'id'>;

export type CreateReportInput = Omit<Report, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateReportInput = Partial<CreateReportInput>;

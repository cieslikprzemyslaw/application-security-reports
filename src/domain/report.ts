import type {
  AssessmentId,
  ISODateString,
  ReportId,
  ReportStatus,
  ReportVersionId,
  Severity,
  StrideCategory,
  ThreatId,
  ThreatStatus,
  TimestampedEntity,
} from './common.js';

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

export interface ReportSnapshot {
  reportTitle: string;
  companyName: string;
  assessmentTitle: string;
  executiveSummary?: string;
  threats: ReportThreatSnapshot[];
}

export interface ReportVersion {
  id: ReportVersionId;
  reportId: ReportId;
  version: number;
  generatedAt: ISODateString;
  filePath?: string;
  snapshot: ReportSnapshot;
}

export type CreateReportInput = Omit<Report, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateReportInput = Partial<CreateReportInput>;

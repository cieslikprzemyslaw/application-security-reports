export type CompanyId = string;
export type AssessmentId = string;
export type ThreatId = string;
export type EvidenceId = string;
export type ReportId = string;
export type ReportVersionId = string;
export type ActivityId = string;
export type SettingsId = string;

export type ISODateString = string;

export interface TimestampedEntity {
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export const SEVERITIES = [
  'informational',
  'low',
  'medium',
  'high',
  'critical',
] as const;

export type Severity = (typeof SEVERITIES)[number];

export const STRIDE_CATEGORIES = [
  'spoofing',
  'tampering',
  'repudiation',
  'information-disclosure',
  'denial-of-service',
  'elevation-of-privilege',
] as const;

export type StrideCategory = (typeof STRIDE_CATEGORIES)[number];

export const STRIDE_LABELS: Record<StrideCategory, string> = {
  spoofing: 'Spoofing',
  tampering: 'Tampering',
  repudiation: 'Repudiation',
  'information-disclosure': 'Information Disclosure',
  'denial-of-service': 'Denial of Service',
  'elevation-of-privilege': 'Elevation of Privilege',
};

export const EVIDENCE_TYPES = [
  'http',
  'text',
  'terminal',
  'log',
  'file',
  'note',
  'screenshot',
  'request',
  'response',
] as const;

export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

export const ASSESSMENT_STATUSES = [
  'draft',
  'in-progress',
  'completed',
  'archived',
] as const;

export type AssessmentStatus = (typeof ASSESSMENT_STATUSES)[number];

export const THREAT_STATUSES = [
  'draft',
  'open',
  'resolved',
  'in-review',
  'mitigated',
  'accepted-risk',
  'false-positive',
] as const;

export type ThreatStatus = (typeof THREAT_STATUSES)[number];

export const REPORT_STATUSES = ['draft', 'generated', 'archived'] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_VERSION_STATUSES = ['draft', 'final'] as const;

export type ReportVersionStatus = (typeof REPORT_VERSION_STATUSES)[number];

export const ACTIVITY_ACTIONS = [
  'created',
  'updated',
  'deleted',
  'status-changed',
  'evidence-added',
  'report-generated',
] as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export const ACTIVITY_ENTITY_TYPES = [
  'company',
  'assessment',
  'threat',
  'evidence',
  'report',
  'settings',
] as const;

export type ActivityEntityType = (typeof ACTIVITY_ENTITY_TYPES)[number];

export type DomainEntityId =
  | CompanyId
  | AssessmentId
  | ThreatId
  | EvidenceId
  | ReportId
  | SettingsId;

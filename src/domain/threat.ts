import type {
  AssessmentId,
  ISODateString,
  Severity,
  StrideCategory,
  ThreatId,
  ThreatStatus,
  TimestampedEntity,
} from './common';

export interface Threat extends TimestampedEntity {
  id: ThreatId;
  assessmentId: AssessmentId;
  title: string;
  description: string;
  severity: Severity;
  strideCategories: StrideCategory[];
  status: ThreatStatus;
  affectedAsset?: string;
  impact?: string;
  recommendation?: string;
  observation?: string;
  affectedComponent?: string;
  affectedEndpoint?: string;
  risk?: string;
}

export type CreateThreatInput = Omit<Threat, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateThreatInput = Partial<CreateThreatInput>;

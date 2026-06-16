import type {
  AssessmentId,
  Severity,
  StrideCategory,
  ThreatId,
  ThreatStatus,
  TimestampedEntity,
} from './common.js';

export interface Threat extends TimestampedEntity {
  id: ThreatId;
  assessmentId: AssessmentId;
  title: string;
  description: string;
  severity: Severity;
  strideCategories: StrideCategory[];
  status: ThreatStatus;
  owaspCategoryCode?: string;
  customCategory?: string;
  affectedAsset?: string;
  impact?: string;
  recommendation?: string;
  remediation?: string;
  observation?: string;
  reproductionSteps?: string;
  affectedComponent?: string;
  affectedEndpoint?: string;
  risk?: string;
  references?: string;
  evidenceCount?: number;
  resolutionNote?: string;
  acceptedRiskJustification?: string;
}

export type CreateThreatInput = Omit<Threat, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateThreatInput = Partial<CreateThreatInput>;

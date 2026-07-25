import type { CweCatalogVersion, CweStatus } from './cwe.js';
import type {
  AssessmentId,
  Severity,
  StrideCategory,
  ThreatId,
  ThreatStatus,
  TimestampedEntity,
} from './common.js';

export interface ThreatCweMapping {
  id: string;
  name: string;
  status: CweStatus;
  deprecated: boolean;
  primary: boolean;
  replacementIds: string[];
}

export interface Threat extends TimestampedEntity {
  id: ThreatId;
  assessmentId: AssessmentId;
  title: string;
  description: string;
  severity: Severity;
  strideCategories: StrideCategory[];
  status: ThreatStatus;
  cweCatalogVersion: CweCatalogVersion;
  cweMappings: ThreatCweMapping[];
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

export type CreateThreatInput = Omit<
  Threat,
  'id' | 'createdAt' | 'updatedAt' | 'cweCatalogVersion' | 'cweMappings'
> & {
  cweIds?: string[];
};

export type UpdateThreatInput = Partial<
  Omit<CreateThreatInput, 'assessmentId'>
>;

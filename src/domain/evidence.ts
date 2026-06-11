import type {
  AssessmentId,
  EvidenceId,
  EvidenceType,
  ISODateString,
  ThreatId,
  TimestampedEntity,
} from './common';

export interface Evidence extends TimestampedEntity {
  id: EvidenceId;
  assessmentId: AssessmentId;
  threatIds: ThreatId[];
  type: EvidenceType;
  title: string;
  description?: string;
  content?: string;
  fileName?: string;
  filePath?: string;
  mimeType?: string;
  capturedAt?: ISODateString;
}

export type CreateEvidenceInput = Omit<Evidence, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateEvidenceInput = Partial<CreateEvidenceInput>;

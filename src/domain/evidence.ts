import type {
  AssessmentId,
  EvidenceId,
  EvidenceType,
  ISODateString,
  ThreatId,
  TimestampedEntity,
} from './common.js';

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
  storageKey?: string;
  mimeType?: string;
  attachmentSizeBytes?: number;
  capturedAt?: ISODateString;
  httpExchanges?: EvidenceHttpExchange[];
}

export interface EvidenceHttpMessage {
  headers?: Record<string, string>;
  body?: string;
}

export interface EvidenceHttpRequest extends EvidenceHttpMessage {
  method: string;
  url: string;
}

export interface EvidenceHttpResponse extends EvidenceHttpMessage {
  statusCode: number;
  statusText?: string;
}

export interface EvidenceHttpExchange {
  request: EvidenceHttpRequest;
  response: EvidenceHttpResponse;
}

export type CreateEvidenceInput = Omit<
  Evidence,
  'id' | 'createdAt' | 'updatedAt'
>;

export type UpdateEvidenceInput = Partial<CreateEvidenceInput>;

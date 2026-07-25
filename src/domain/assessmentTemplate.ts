import type { AssessmentTemplateId, ISODateString, TimestampedEntity } from './common.js';

export interface AssessmentTemplate extends TimestampedEntity {
  id: AssessmentTemplateId;
  name: string;
  assessmentType: string;
  environment: string;
  description?: string;
  scope?: string;
  archivedAt?: ISODateString | null;
}

export interface CreateAssessmentTemplateInput {
  name: string;
  assessmentType: string;
  environment: string;
  description?: string;
  scope?: string;
}

export interface UpdateAssessmentTemplateInput {
  name?: string;
  assessmentType?: string;
  environment?: string;
  description?: string;
  scope?: string;
}

export interface AssessmentTemplateListOptions {
  includeArchived?: boolean;
}

import type {
  AssessmentId,
  AssessmentStatus,
  CompanyId,
  ISODateString,
  Severity,
  TimestampedEntity,
} from './common.js';

export interface Assessment extends TimestampedEntity {
  id: AssessmentId;
  companyId: CompanyId;
  title: string;
  description?: string;
  scope?: string;
  status: AssessmentStatus;
  startedAt?: ISODateString;
  completedAt?: ISODateString;
  applicationName: string | null;
  environment?: string;
  assessmentType?: string;
  overallRisk?: Severity;
  owaspTaxonomyVersion?: string;
}

export interface CreateAssessmentInput {
  companyId: CompanyId;
  title: string;
  description?: string;
  scope?: string;
  status: AssessmentStatus;
  startedAt?: ISODateString;
  completedAt?: ISODateString;
  applicationName: string;
  environment?: string;
  assessmentType?: string;
  overallRisk?: Severity;
}

export interface UpdateAssessmentInput {
  title?: string;
  description?: string;
  scope?: string;
  status?: AssessmentStatus;
  startedAt?: ISODateString;
  completedAt?: ISODateString;
  applicationName?: string;
  environment?: string;
  assessmentType?: string;
  overallRisk?: Severity;
}

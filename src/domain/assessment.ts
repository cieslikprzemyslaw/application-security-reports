import type {
  AssessmentId,
  AssessmentStatus,
  CompanyId,
  ISODateString,
  Severity,
  TimestampedEntity,
} from './common.js';
import type { CweCatalogVersion } from './cwe.js';
import type { OwaspTop10Version } from './owaspTop10.js';

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
  owaspTaxonomyVersion: OwaspTop10Version;
  cweCatalogVersion: CweCatalogVersion;
  recordVersion: number;
  archivedAt: ISODateString | null;
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
  startedAt?: ISODateString;
  applicationName?: string;
  environment?: string;
  assessmentType?: string;
  overallRisk?: Severity;
}

export type AssessmentLifecycleCommand =
  | 'complete'
  | 'reopen'
  | 'archive'
  | 'restore';

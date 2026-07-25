import type { ReactNode } from 'react';

import type {
  AssessmentStatus,
  CweCatalogVersion,
  OwaspTop10Version,
  Severity,
} from '~/domain';

export const assessmentDetailSections = [
  'overview',
  'findings',
  'evidence',
  'reports',
  'history',
] as const;

export type AssessmentDetailSection = (typeof assessmentDetailSections)[number];

export const isAssessmentDetailSection = (
  value: string | undefined,
): value is AssessmentDetailSection =>
  value !== undefined &&
  assessmentDetailSections.includes(value as AssessmentDetailSection);

export const assessmentDetailActions = [
  'start',
  'complete',
  'reopen',
  'archive',
  'restore',
] as const;

export type AssessmentDetailAction = (typeof assessmentDetailActions)[number];

export interface AssessmentDetailsAssessment {
  id: string;
  companyId: string;
  companyName: string;
  title?: string;
  applicationName: string;
  assessmentType?: string;
  description?: string;
  scope?: string;
  startedAt?: string;
  completedAt?: string;
  environment?: string;
  status: AssessmentStatus;
  overallRisk?: Severity;
  owaspTaxonomyVersion: OwaspTop10Version;
  cweCatalogVersion?: CweCatalogVersion;
  recordVersion?: number;
  archivedAt?: string | null;
  findingsCount: number;
  evidenceCount: number;
  reportVersionCount: number;
  testerName?: string;
  availableActions?: AssessmentDetailAction[];
}

export interface AssessmentDetailsViewProps {
  assessment: AssessmentDetailsAssessment;
  activeSection: AssessmentDetailSection;
  companiesHref: string;
  companyHref: string;
  assessmentsHref: string;
  overviewHref: string;
  findingsContent?: ReactNode;
  evidenceContent?: ReactNode;
  reportsContent?: ReactNode;
  onSectionChange: (section: AssessmentDetailSection) => void;
  onBack?: () => void;
  onAction: (action: AssessmentDetailAction) => void;
  isActionLoading?: boolean;
  pendingAction?: AssessmentDetailAction;
  actionError?: string;
  conflictError?: string;
  onPermanentDeleteRequest?: () => void;
}

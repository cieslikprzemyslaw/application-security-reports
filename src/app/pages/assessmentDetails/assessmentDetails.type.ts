import type { ReactNode } from 'react';

import type { AssessmentStatus, Severity } from '~/domain';

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
] as const;

export type AssessmentDetailAction = (typeof assessmentDetailActions)[number];

export interface AssessmentDetailsAssessment {
  id: string;
  companyId: string;
  companyName: string;
  applicationName: string;
  assessmentType?: string;
  description?: string;
  scope?: string;
  startedAt?: string;
  completedAt?: string;
  environment?: string;
  status: AssessmentStatus;
  overallRisk?: Severity;
  recordVersion: number;
  findingsCount: number;
  evidenceCount: number;
  reportVersionCount: number;
  testerName?: string;
  availableActions?: AssessmentDetailAction[];
}

export interface AssessmentDetailsViewProps {
  assessment: AssessmentDetailsAssessment;
  activeSection: AssessmentDetailSection;
  overviewHref: string;
  findingsContent?: ReactNode;
  evidenceContent?: ReactNode;
  onSectionChange: (section: AssessmentDetailSection) => void;
  onBack?: () => void;
  onAction: (action: AssessmentDetailAction) => void;
  isActionLoading?: boolean;
  pendingAction?: AssessmentDetailAction;
  actionError?: string;
  conflictError?: string;
}

import type { ReactNode } from 'react';

import type { AssessmentStatus, Severity } from '~/domain';

export type AssessmentLogoTone =
  | 'blue'
  | 'indigo'
  | 'cyan'
  | 'green'
  | 'purple'
  | 'slate';

export interface AssessmentTableRow {
  id: string;
  code: string;
  initials: string;
  logoTone?: AssessmentLogoTone;
  applicationName: string;
  companyName: string;
  assessmentType: string;
  environment: string;
  overallRisk: Severity;
  findingsCount: number;
  criticalCount?: number;
  highCount?: number;
  testerName: string;
  status: AssessmentStatus;
}

export type AssessmentListSortKey =
  | 'name'
  | 'type'
  | 'status'
  | 'findings'
  | 'updated';

export interface AssessmentListRow {
  id: string;
  name: string;
  type: string;
  status: AssessmentStatus;
  findingsCount: number;
  updatedAt: string;
  description?: string;
  scope?: string;
}

export interface AssessmentTableProps {
  assessments: AssessmentListRow[];
  sortBy: AssessmentListSortKey;
  sortDirection: 'asc' | 'desc';
  onSortChange: (sortBy: AssessmentListSortKey) => void;
  onAssessmentClick?: (assessment: AssessmentListRow) => void;
  onEditAssessment?: (assessment: AssessmentListRow) => void;
  emptyState?: ReactNode;
}

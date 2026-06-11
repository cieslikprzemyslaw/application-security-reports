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

export interface AssessmentTableProps {
  assessments: AssessmentTableRow[];
  onAssessmentClick?: (assessment: AssessmentTableRow) => void;
}

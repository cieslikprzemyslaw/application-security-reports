import type { AssessmentStatus, Severity } from '~/domain';

export interface RecentAssessmentRow {
  id: string;
  applicationName: string;
  companyName: string;
  assessmentType: string;
  severity: Severity;
  findingsCount: number;
  status: AssessmentStatus;
}

export interface RecentAssessmentTableProps {
  assessments: RecentAssessmentRow[];
  onAssessmentClick?: (assessment: RecentAssessmentRow) => void;
}

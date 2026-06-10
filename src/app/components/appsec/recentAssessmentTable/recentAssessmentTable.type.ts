import type { Severity } from '~/app/components/ui/severityBadge';
import type { ThreatStatus } from '~/app/components/ui/statusBadge';

export interface RecentAssessmentRow {
  id: string;
  applicationName: string;
  companyName: string;
  assessmentType: string;
  severity: Severity;
  findingsCount: number;
  status: ThreatStatus;
}

export interface RecentAssessmentTableProps {
  assessments: RecentAssessmentRow[];
  onAssessmentClick?: (assessment: RecentAssessmentRow) => void;
}

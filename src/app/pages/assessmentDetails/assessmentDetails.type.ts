import type { AssessmentTableRow } from '../../components/appsec/assessmentTable';
import type { GlobalThreatRow } from '../../components/appsec/globalThreatTable';

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

export interface AssessmentDetailsProps {
  assessment: AssessmentTableRow;
  threats: GlobalThreatRow[];
  executiveSummary: string;
  activeSection: AssessmentDetailSection;
  overviewHref: string;
  onSectionChange: (section: AssessmentDetailSection) => void;
  onBack?: () => void;
  onEdit?: () => void;
  onAddThreat?: () => void;
  onThreatClick?: (threat: GlobalThreatRow) => void;
}

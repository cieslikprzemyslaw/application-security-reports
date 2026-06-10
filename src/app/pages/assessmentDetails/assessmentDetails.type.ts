import type { AssessmentTableRow } from '../../components/appsec/assessmentTable';
import type { GlobalThreatRow } from '../../components/appsec/globalThreatTable';

export interface AssessmentDetailsProps {
  assessment: AssessmentTableRow;
  threats: GlobalThreatRow[];
  executiveSummary: string;
  onBack?: () => void;
  onEdit?: () => void;
  onAddThreat?: () => void;
  onThreatClick?: (threat: GlobalThreatRow) => void;
}

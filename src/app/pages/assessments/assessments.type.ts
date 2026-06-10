import type { AssessmentTableRow } from '../../components/appsec/assessmentTable';

export interface AssessmentsProps {
  assessments: AssessmentTableRow[];
  searchValue: string;
  statusFilter: string;
  riskFilter: string;
  typeFilter: string;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onRiskFilterChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  onCreateAssessment?: () => void;
  onAssessmentClick?: (assessment: AssessmentTableRow) => void;
}

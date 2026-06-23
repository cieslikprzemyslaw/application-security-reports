import type { Severity } from '~/domain';

export interface ReportBuilderSelectionTreeEvidence {
  id: string;
  title: string;
  description?: string;
}

export interface ReportBuilderSelectionTreeThreat {
  id: string;
  title: string;
  severity: Severity;
  evidence: ReportBuilderSelectionTreeEvidence[];
}

export interface ReportBuilderSelectionTreeProps {
  assessmentTitle: string;
  includeEvidence: boolean;
  selectedThreatIds: readonly string[];
  selectedEvidenceIds: readonly string[];
  threats: ReportBuilderSelectionTreeThreat[];
  onIncludeEvidenceChange: (checked: boolean) => void;
  onThreatToggle: (threatId: string, checked: boolean) => void;
  onEvidenceToggle: (evidenceId: string, checked: boolean) => void;
}

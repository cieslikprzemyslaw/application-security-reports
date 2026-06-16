import type { Severity, ThreatStatus } from '~/domain';

export interface ThreatTableRow {
  id: string;
  title: string;
  owaspCategoryCode?: string;
  customCategory?: string;
  severity: Severity;
  status: ThreatStatus;
  evidenceCount?: number;
  updatedAt: string;
  applicationName?: string;
  companyName?: string;
  affectedComponent?: string;
  affectedEndpoint?: string;
  impact?: string;
  recommendation?: string;
  remediation?: string;
  observation?: string;
  reproductionSteps?: string;
  risk?: string;
}

export interface ThreatTableProps {
  threats: ThreatTableRow[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  onThreatClick?: (threat: ThreatTableRow) => void;
  onEditThreatClick?: (threat: ThreatTableRow) => void;
}

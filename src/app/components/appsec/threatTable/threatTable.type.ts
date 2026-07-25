import type {
  CweCatalogVersion,
  OwaspTop10Version,
  Severity,
  ThreatCweMapping,
  ThreatStatus,
} from '~/domain';

export interface ThreatTableRow {
  id: string;
  title: string;
  owaspCategoryCode?: string;
  customCategory?: string;
  cweCatalogVersion?: CweCatalogVersion;
  cweMappings?: ThreatCweMapping[];
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
  references?: string;
  resolutionNote?: string;
  acceptedRiskJustification?: string;
}

export interface ThreatTableProps {
  threats: ThreatTableRow[];
  owaspTaxonomyVersion?: OwaspTop10Version;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  onThreatClick?: (threat: ThreatTableRow) => void;
  onEditThreatClick?: (threat: ThreatTableRow) => void;
  onDeleteThreatClick?: (threat: ThreatTableRow) => void;
}

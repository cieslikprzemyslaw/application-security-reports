import type { ReactNode } from 'react';

import type {
  CweCatalogVersion,
  OwaspTop10Version,
  Severity,
  ThreatCweMapping,
  ThreatStatus,
} from '~/domain';

import type { ThreatTableRow } from '../threatTable';

export interface ThreatDrawerFinding {
  id: string;
  title: string;
  severity: Severity;
  status: ThreatStatus;
  owaspCategoryCode?: string;
  customCategory?: string;
  cweCatalogVersion?: CweCatalogVersion;
  cweMappings?: ThreatCweMapping[];
  evidenceCount?: number;
  applicationName?: string;
  companyName?: string;
  affectedComponent?: string;
  affectedEndpoint?: string;
  impact?: string;
  risk?: string;
  recommendation?: string;
  remediation?: string;
  observation?: string;
  reproductionSteps?: string;
  references?: string;
  resolutionNote?: string;
  acceptedRiskJustification?: string;
  updatedAt?: string;
}

export interface ThreatDrawerProps {
  isOpen: boolean;
  owaspTaxonomyVersion?: OwaspTop10Version;
  threat?: ThreatDrawerFinding | ThreatTableRow;
  title?: string;
  description?: ReactNode;
  recommendation?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  closeLabel?: string;
}

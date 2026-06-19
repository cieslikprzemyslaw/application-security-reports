import type { ReactNode } from 'react';

import type { Severity, ThreatStatus } from '~/domain';

import type { ThreatTableRow } from '../threatTable';

export interface ThreatDrawerFinding {
  id: string;
  title: string;
  severity: Severity;
  status: ThreatStatus;
  owaspCategoryCode?: string;
  customCategory?: string;
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
  owaspTaxonomyVersion?: string;
  threat?: ThreatDrawerFinding | ThreatTableRow;
  title?: string;
  description?: ReactNode;
  recommendation?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  onEdit?: () => void;
  closeLabel?: string;
}

import type { ReactNode } from 'react';

import type { Severity, StrideCategory, ThreatStatus } from '~/domain';

export interface GlobalThreatRow {
  id: string;
  title: string;
  applicationName: string;
  companyName: string;
  owaspCategoryCode?: string;
  customCategory?: string;
  strideCategory: StrideCategory;
  severity: Severity;
  status: ThreatStatus;
  evidenceCount?: number;
  updatedAt: string;
}

export interface GlobalThreatTableProps {
  threats: GlobalThreatRow[];
  onThreatClick?: (threat: GlobalThreatRow) => void;
  emptyState?: ReactNode;
}

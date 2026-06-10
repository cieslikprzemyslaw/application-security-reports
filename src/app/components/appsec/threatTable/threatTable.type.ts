import type { Severity } from '~/app/components/ui/severityBadge';
import type { ThreatStatus } from '~/app/components/ui/statusBadge';

import type { StrideCategory } from '../threatForm';

export interface ThreatTableRow {
  id: string;
  title: string;
  endpoint?: string;
  strideCategory: StrideCategory;
  severity: Severity;
  status: ThreatStatus;
  component: string;
  updatedAt: string;
}

export interface ThreatTableProps {
  threats: ThreatTableRow[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  onThreatClick?: (threat: ThreatTableRow) => void;
}

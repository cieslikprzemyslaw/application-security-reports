import type { Severity, StrideCategory, ThreatStatus } from '~/domain';

export interface GlobalThreatRow {
  id: string;
  title: string;
  applicationName: string;
  companyName: string;
  strideCategory: StrideCategory;
  severity: Severity;
  status: ThreatStatus;
  updatedAt: string;
}

export interface GlobalThreatTableProps {
  threats: GlobalThreatRow[];
  onThreatClick?: (threat: GlobalThreatRow) => void;
}

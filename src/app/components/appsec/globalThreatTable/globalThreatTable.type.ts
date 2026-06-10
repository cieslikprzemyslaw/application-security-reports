import { RiskLevel, ThreatStatus } from '~/app/types/pageShared.type';

export interface GlobalThreatRow {
  id: string;
  title: string;
  applicationName: string;
  companyName: string;
  strideCategory: string;
  severity: RiskLevel;
  status: ThreatStatus;
  updatedAt: string;
}

export interface GlobalThreatTableProps {
  threats: GlobalThreatRow[];
  onThreatClick?: (threat: GlobalThreatRow) => void;
}

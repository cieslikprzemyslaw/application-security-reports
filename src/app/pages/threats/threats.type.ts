import type { GlobalThreatRow } from '../../components/appsec/globalThreatTable';

export interface ThreatsProps {
  threats: GlobalThreatRow[];
  searchValue: string;
  severityFilter: string;
  statusFilter: string;
  applicationFilter: string;
  selectedThreat?: GlobalThreatRow;
  isDrawerOpen: boolean;
  onSearchChange: (value: string) => void;
  onSeverityFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onApplicationFilterChange: (value: string) => void;
  onThreatClick: (threat: GlobalThreatRow) => void;
  onDrawerClose: () => void;
  onExport?: () => void;
  onAddThreat?: () => void;
}

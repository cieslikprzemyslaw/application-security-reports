import type { GlobalThreatRow } from '../../components/appsec/globalThreatTable';
import type { ThreatSeverityFilter, ThreatStatusFilter } from './threats.utils';

export interface ThreatsProps {
  threats: GlobalThreatRow[];
  searchValue: string;
  severityFilter: ThreatSeverityFilter;
  statusFilter: ThreatStatusFilter;
  applicationFilter: string;
  selectedThreat?: GlobalThreatRow;
  isDrawerOpen: boolean;
  onSearchChange: (value: string) => void;
  onSeverityFilterChange: (value: ThreatSeverityFilter) => void;
  onStatusFilterChange: (value: ThreatStatusFilter) => void;
  onApplicationFilterChange: (value: string) => void;
  onClearControls?: () => void;
  onThreatClick: (threat: GlobalThreatRow) => void;
  onDrawerClose: () => void;
  onExport?: () => void;
  onAddThreat?: () => void;
}

import type { GlobalThreatRow } from '~/app/components/appsec/globalThreatTable';
import type { ListQueryField } from '~/app/hooks/useListQueryState';

export type ThreatSeverityFilter =
  | 'all'
  | 'critical'
  | 'high'
  | 'medium'
  | 'low';
export type ThreatStatusFilter =
  | 'all'
  | 'open'
  | 'in-review'
  | 'mitigated'
  | 'accepted-risk'
  | 'false-positive';

export interface ThreatsQueryState {
  search: string;
  severity: ThreatSeverityFilter;
  status: ThreatStatusFilter;
  application: string;
}

export const defaultThreatsQueryState: ThreatsQueryState = {
  search: '',
  severity: 'all',
  status: 'all',
  application: 'all',
};

export const threatSeverityOptions = [
  { label: 'All severity', value: 'all' },
  { label: 'Critical', value: 'critical' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
] as const;

export const threatStatusOptions = [
  { label: 'All status', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'In review', value: 'in-review' },
  { label: 'Mitigated', value: 'mitigated' },
  { label: 'Accepted risk', value: 'accepted-risk' },
  { label: 'False positive', value: 'false-positive' },
] as const;

const isThreatSeverityFilter = (
  value: string | null,
): value is ThreatSeverityFilter =>
  threatSeverityOptions.some(option => option.value === value);

const isThreatStatusFilter = (
  value: string | null,
): value is ThreatStatusFilter =>
  threatStatusOptions.some(option => option.value === value);

export const createThreatsQueryFields = (
  applications: ReadonlyArray<string>,
): ReadonlyArray<ListQueryField<ThreatsQueryState>> => [
  {
    key: 'search',
    param: 'search',
    defaultValue: defaultThreatsQueryState.search,
    parse: value => value ?? defaultThreatsQueryState.search,
  },
  {
    key: 'severity',
    param: 'severity',
    defaultValue: defaultThreatsQueryState.severity,
    parse: value =>
      isThreatSeverityFilter(value) ? value : defaultThreatsQueryState.severity,
  },
  {
    key: 'status',
    param: 'status',
    defaultValue: defaultThreatsQueryState.status,
    parse: value =>
      isThreatStatusFilter(value) ? value : defaultThreatsQueryState.status,
  },
  {
    key: 'application',
    param: 'application',
    defaultValue: defaultThreatsQueryState.application,
    parse: value =>
      value && applications.includes(value)
        ? value
        : defaultThreatsQueryState.application,
  },
];

export const getThreatApplications = (
  threats: ReadonlyArray<GlobalThreatRow>,
) =>
  Array.from(new Set(threats.map(threat => threat.applicationName))).sort(
    (left, right) =>
      left.localeCompare(right, undefined, { sensitivity: 'base' }),
  );

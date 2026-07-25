import type { ReportPreviewShellTab } from '~/app/components/appsec/reportPreviewShell';
import type { ReportBuilderState } from '~/domain';

import type { ReportBuilderFocusTarget, ReportsProps } from './reports.type';
import type { ReportsShellProps } from './reportsShell.component';

export const formatReportVersionNumber = (version: number): string => {
  const major = Math.floor(version / 10);
  const minor = version % 10;

  return `${major}.${minor}`;
};

const hasSameReportBuilderSelection = (
  left: ReportBuilderState['selection'],
  right: ReportBuilderState['selection'],
): boolean => JSON.stringify(left) === JSON.stringify(right);

export const preserveCurrentReportIdForStaleRouteState = (
  restoredState: ReportBuilderState,
  currentState: ReportBuilderState,
): ReportBuilderState => {
  if (restoredState.reportId || !currentState.reportId) {
    return restoredState;
  }

  if (
    !hasSameReportBuilderSelection(
      restoredState.selection,
      currentState.selection,
    )
  ) {
    return restoredState;
  }

  return {
    ...restoredState,
    reportId: currentState.reportId,
  };
};

export interface ReportBuilderReportsProps extends Omit<
  ReportsShellProps,
  'dataView'
> {
  companyId: string;
  companyName: string;
  routeState?: unknown;
  activeView: ReportPreviewShellTab;
  focusTarget?: ReportBuilderFocusTarget;
  focusKey?: string;
  onViewChange?: (
    view: ReportPreviewShellTab,
    state: ReportBuilderState,
  ) => void;
  onStateChange?: (state: ReportBuilderState) => void;
  onReadinessTargetNavigate?: ReportsProps['onReadinessTargetNavigate'];
}

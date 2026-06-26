import type { ReactNode } from 'react';

import type { ReportCoverProps } from '~/app/components/appsec/reportCover';
import type { ReportPreviewShellTab } from '~/app/components/appsec/reportPreviewShell';
import type { ReportBuilderState } from '~/domain';

export type ReportBuilderFocusTarget = 'preview-tab' | 'preview-heading';

export interface ReportsProps {
  cover?: ReportCoverProps;
  companyId?: string;
  companyName?: string;
  dataView?: ReactNode;
  autoSaved?: boolean;
  builderRouteState?: unknown;
  builderView?: ReportPreviewShellTab;
  builderFocusTarget?: ReportBuilderFocusTarget;
  builderFocusKey?: string;
  onBuilderViewChange?: (
    view: ReportPreviewShellTab,
    state: ReportBuilderState,
  ) => void;
  onBuilderStateChange?: (state: ReportBuilderState) => void;
}

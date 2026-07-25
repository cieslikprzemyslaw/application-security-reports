import React from 'react';

import type {
  ReportBrandingMode,
  ReportBuilderConfiguration,
  ReportBuilderSelection,
  ReportBuilderState,
  ReportReadinessTarget,
} from '~/domain';

import type { ReportBuilderSelectionTreeState } from './reportBuilderSelectionTree';
import ReportBuilderTree from './reportBuilderTree.component';
import ReportBuilderWorkspace from './reportBuilderWorkspace.component';

interface ReportBuilderDataViewProps {
  builderState: ReportBuilderState;
  selectionState: ReportBuilderSelectionTreeState;
  companyId: string;
  companyName: string;
  readinessStatus: string;
  focusTarget?: ReportReadinessTarget;
  onSelectionChange: (
    nextState: ReportBuilderSelectionTreeState,
    exactSelection: ReportBuilderSelection,
  ) => void;
  onConfigurationChange: (patch: Partial<ReportBuilderConfiguration>) => void;
  onBrandingModeChange: (mode: ReportBrandingMode) => void;
}

const ReportBuilderDataView = ({
  builderState,
  selectionState,
  companyId,
  companyName,
  readinessStatus,
  focusTarget,
  onSelectionChange,
  onConfigurationChange,
  onBrandingModeChange,
}: ReportBuilderDataViewProps) => (
  <ReportBuilderWorkspace
    builderState={builderState}
    readinessStatus={readinessStatus}
    onBrandingModeChange={onBrandingModeChange}
  >
    <ReportBuilderTree
      companyId={companyId}
      companyName={companyName}
      includeEvidence={builderState.configuration.includeEvidence}
      methodology={builderState.configuration.methodology}
      reportStyle={builderState.configuration.reportStyle}
      selection={builderState.selection}
      selectionState={selectionState}
      lockedAssessmentId={
        builderState.reportId
          ? builderState.selection.selectedAssessmentId
          : undefined
      }
      focusTarget={focusTarget}
      onSelectionChange={onSelectionChange}
      onConfigurationChange={onConfigurationChange}
      onIncludeEvidenceChange={includeEvidence =>
        onConfigurationChange({ includeEvidence })
      }
    />
  </ReportBuilderWorkspace>
);

export default ReportBuilderDataView;

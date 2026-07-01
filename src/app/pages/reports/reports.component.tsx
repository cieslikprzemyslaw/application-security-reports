import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import ReportPreviewShell from '~/app/components/appsec/reportPreviewShell';

import {
  createReportBuilderSelectionTreeState,
  type ReportBuilderSelectionTreeState,
} from './reportBuilderSelectionTree';
import {
  restoreReportBuilderRouteState,
  updateReportBuilderConfiguration,
  updateReportBuilderSelection,
} from './reportBuilderState';
import { useReportActionsController } from './reportActions.controller';
import { useReportBootstrapController } from './reportBootstrap.controller';
import ReportBuilderPreview from './reportBuilderPreview.component';
import { useReportDraftSaveController } from './reportDraftSave.controller';
import { useReportFinalSaveController } from './reportFinalSave.controller';
import { useReportPreviewController } from './reportPreview.controller';
import { useReportReadinessController } from './reportReadiness.controller';
import ReportReadinessPanel from './reportReadinessPanel.component';
import { useReportReadinessTargetNavigation } from './reportReadinessTargetNavigation';
import ReportBuilderTree from './reportBuilderTree.component';
import ReportsShell, {
  fallbackReportCover,
  type ReportsShellProps,
} from './reportsShell.component';

import type { ReportBuilderSelection, ReportBuilderState } from '~/domain';
import type { ReportPreviewShellTab } from '~/app/components/appsec/reportPreviewShell';
import type { ReportBuilderFocusTarget, ReportsProps } from './reports.type';

const formatReportVersionNumber = (version: number): string => {
  const major = Math.floor(version / 10);
  const minor = version % 10;

  return `${major}.${minor}`;
};

const hasSameReportBuilderSelection = (
  left: ReportBuilderState['selection'],
  right: ReportBuilderState['selection'],
): boolean => JSON.stringify(left) === JSON.stringify(right);

const preserveCurrentReportIdForStaleRouteState = (
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

interface ReportBuilderReportsProps extends Omit<
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

const ReportBuilderReports = ({
  cover,
  companyId,
  companyName,
  routeState,
  activeView,
  focusTarget,
  focusKey,
  onViewChange,
  onStateChange,
  onReadinessTargetNavigate,
}: ReportBuilderReportsProps) => {
  const [builderState, setBuilderState] = useState(() =>
    restoreReportBuilderRouteState(companyId, routeState),
  );
  const [selectionState, setSelectionState] =
    useState<ReportBuilderSelectionTreeState>(() =>
      createReportBuilderSelectionTreeState(builderState.selection),
    );
  const builderStateRef = useRef(builderState);
  const previewTabRef = useRef<HTMLButtonElement>(null);
  const previewHeadingRef = useRef<HTMLHeadingElement>(null);
  const previewController = useReportPreviewController(builderState);

  const handleBuilderStateChange = useCallback(
    (nextState: ReportBuilderState) => {
      builderStateRef.current = nextState;
      setBuilderState(nextState);
      onStateChange?.(nextState);
    },
    [onStateChange],
  );

  const bootstrapController = useReportBootstrapController({
    builderState,
    onBuilderStateChange: handleBuilderStateChange,
  });

  const bootstrapAssessment = useMemo(() => {
    const assessment = previewController.snapshot?.assessment;

    return assessment
      ? {
          id: assessment.id,
          name: assessment.title,
          applicationName: assessment.applicationName ?? undefined,
        }
      : undefined;
  }, [previewController.snapshot]);

  const draftSaveController = useReportDraftSaveController({
    builderState,
    assessment: bootstrapAssessment,
    bootstrapReport: bootstrapController.bootstrap,
  });
  const finalSaveController = useReportFinalSaveController({
    builderState,
    assessment: bootstrapAssessment,
    bootstrapReport: bootstrapController.bootstrap,
  });
  const readinessController = useReportReadinessController({
    builderState,
    assessment: bootstrapAssessment,
    bootstrapReport: bootstrapController.bootstrap,
  });
  const { clearSelectedVersion: clearDraftSelectedVersion } =
    draftSaveController;
  const { clearSelectedVersion: clearFinalSelectedVersion } =
    finalSaveController;
  const clearSelectedVersions = useCallback(() => {
    clearDraftSelectedVersion();
    clearFinalSelectedVersion();
  }, [clearDraftSelectedVersion, clearFinalSelectedVersion]);

  useEffect(() => {
    builderStateRef.current = builderState;
  }, [builderState]);

  useEffect(() => {
    const restoredState = preserveCurrentReportIdForStaleRouteState(
      restoreReportBuilderRouteState(companyId, routeState),
      builderStateRef.current,
    );

    if (
      JSON.stringify(builderStateRef.current) === JSON.stringify(restoredState)
    ) {
      return;
    }

    clearSelectedVersions();
    builderStateRef.current = restoredState;
    setBuilderState(restoredState);
    setSelectionState(
      createReportBuilderSelectionTreeState(restoredState.selection),
    );
  }, [clearSelectedVersions, companyId, routeState]);

  useEffect(() => {
    if (focusTarget === 'preview-tab') {
      previewTabRef.current?.focus();
      return;
    }

    if (focusTarget === 'preview-heading') {
      previewHeadingRef.current?.focus();
    }
  }, [focusKey, focusTarget]);

  const handleSelectionChange = (
    nextSelectionState: ReportBuilderSelectionTreeState,
    exactSelection: ReportBuilderSelection,
  ) => {
    clearSelectedVersions();
    setSelectionState(nextSelectionState);
    setBuilderState(current => {
      const nextState = updateReportBuilderSelection(current, {
        selectedAssessmentId: exactSelection.selectedAssessmentId ?? null,
        selectedThreatIds: exactSelection.selectedThreatIds,
        selectedEvidenceIds: exactSelection.selectedEvidenceIds,
        selectedEvidenceSelections: exactSelection.selectedEvidenceSelections,
      });

      builderStateRef.current = nextState;

      return nextState;
    });
  };

  const handleIncludeEvidenceChange = (includeEvidence: boolean) => {
    clearSelectedVersions();
    setBuilderState(current => {
      const nextState = updateReportBuilderConfiguration(current, {
        includeEvidence,
      });

      builderStateRef.current = nextState;

      return nextState;
    });
  };

  const selectedVersion =
    finalSaveController.selectedVersion ?? draftSaveController.selectedVersion;
  const displayedSnapshot =
    selectedVersion?.snapshot ?? previewController.snapshot;
  const displayedStatus = selectedVersion
    ? 'success'
    : previewController.status;
  const displayedErrorMessage = selectedVersion
    ? undefined
    : previewController.errorMessage;

  const previewCover = displayedSnapshot
    ? {
        ...cover,
        applicationName:
          displayedSnapshot.assessment.applicationName ??
          displayedSnapshot.assessment.title,
        reportId: displayedSnapshot.assessment.id,
      }
    : cover;

  const selectedAssessmentId = builderState.selection.selectedAssessmentId;
  const hasCurrentAssessmentPreview =
    previewController.snapshot?.assessment.id === selectedAssessmentId;
  const readinessTargetNavigation = useReportReadinessTargetNavigation({
    activeView,
    builderState,
    onViewChange,
    onExternalNavigate: onReadinessTargetNavigate,
  });
  const reportActionsController = useReportActionsController({
    activeView,
    builderState,
    previewStatus: previewController.status,
    hasCurrentAssessmentPreview,
    selectedVersion,
    readinessController,
    draftSaveController,
    finalSaveController,
    clearDraftSelectedVersion,
    clearFinalSelectedVersion,
    clearSelectedVersions,
    retryPreview: previewController.retry,
    onViewChange,
  });

  const assessmentCode = selectedVersion
    ? `${selectedVersion.reportId} Â· v${formatReportVersionNumber(
        selectedVersion.version,
      )}`
    : previewCover.reportId;

  return (
    <ReportPreviewShell
      applicationName={previewCover.applicationName}
      assessmentCode={assessmentCode}
      autoSaved={false}
      activeTab={activeView}
      onActiveTabChange={nextView => onViewChange?.(nextView, builderState)}
      previewTabRef={previewTabRef}
      titleRef={previewHeadingRef}
      reportActions={reportActionsController.reportActions}
      reportActionStatus={reportActionsController.reportActionStatus}
      readiness={
        readinessController.status === 'idle' ? undefined : (
          <ReportReadinessPanel
            status={readinessController.status}
            result={readinessController.result}
            message={readinessController.message}
            onTargetActivate={readinessTargetNavigation.activateTarget}
          />
        )
      }
      preview={
        <ReportBuilderPreview
          status={displayedStatus}
          snapshot={displayedSnapshot}
          errorMessage={displayedErrorMessage}
          reportId={selectedVersion?.reportId ?? builderState.reportId}
          issuedDate={selectedVersion?.generatedAt}
          onRetry={() => {
            clearSelectedVersions();
            previewController.retry();
          }}
        />
      }
      dataView={
        <ReportBuilderTree
          companyId={companyId}
          companyName={companyName}
          includeEvidence={builderState.configuration.includeEvidence}
          selection={builderState.selection}
          selectionState={selectionState}
          lockedAssessmentId={
            builderState.reportId
              ? builderState.selection.selectedAssessmentId
              : undefined
          }
          focusTarget={readinessTargetNavigation.focusTarget}
          onSelectionChange={handleSelectionChange}
          onIncludeEvidenceChange={handleIncludeEvidenceChange}
        />
      }
    />
  );
};

const Reports = ({
  cover = fallbackReportCover,
  companyId,
  companyName,
  dataView,
  autoSaved = true,
  builderRouteState,
  builderView = 'data',
  builderFocusTarget,
  builderFocusKey,
  onBuilderViewChange,
  onBuilderStateChange,
  onReadinessTargetNavigate,
}: ReportsProps) => {
  if (dataView != null) {
    return (
      <ReportsShell cover={cover} dataView={dataView} autoSaved={autoSaved} />
    );
  }

  if (companyId) {
    return (
      <ReportBuilderReports
        key={companyId}
        cover={cover}
        companyId={companyId}
        companyName={companyName ?? cover.companyName}
        autoSaved={autoSaved}
        routeState={builderRouteState}
        activeView={builderView}
        focusTarget={builderFocusTarget}
        focusKey={builderFocusKey}
        onViewChange={onBuilderViewChange}
        onStateChange={onBuilderStateChange}
        onReadinessTargetNavigate={onReadinessTargetNavigate}
      />
    );
  }

  return (
    <ReportsShell
      cover={cover}
      dataView={<pre>{JSON.stringify(cover, null, 2)}</pre>}
      autoSaved={autoSaved}
    />
  );
};

export default Reports;

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import ReportCover from '~/app/components/appsec/reportCover';
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
import { useReportBootstrapController } from './reportBootstrap.controller';
import ReportBuilderPreview from './reportBuilderPreview.component';
import { useReportDraftSaveController } from './reportDraftSave.controller';
import { useReportPreviewController } from './reportPreview.controller';
import ReportBuilderTree from './reportBuilderTree.component';

import type { ReportBuilderSelection, ReportBuilderState } from '~/domain';
import type { ReportCoverProps } from '~/app/components/appsec/reportCover';
import type {
  ReportPreviewShellActionStatus,
  ReportPreviewShellTab,
} from '~/app/components/appsec/reportPreviewShell';
import type { ReportBuilderFocusTarget, ReportsProps } from './reports.type';

const fallbackCover: ReportCoverProps = {
  companyName: 'Company name',
  companyWebsite: 'company.example',
  reportId: 'REPORT-DRAFT',
  issuedDate: 'Draft',
  applicationName: 'Application name',
  environment: 'Environment',
  engagementDate: 'Not specified',
  testerName: 'Not assigned',
  methodology: 'OWASP ASVS / WSTG',
  findingsCount: 0,
  overallRisk: 'informational',
  executiveSummary: 'Add assessment data to generate the report preview.',
  scope: [],
  findings: [],
  confidential: true,
};

const formatReportVersionNumber = (version: number): string => {
  const major = Math.floor(version / 10);
  const minor = version % 10;

  return `${major}.${minor}`;
};

interface ReportsShellProps {
  cover: ReportCoverProps;
  dataView: React.ReactNode;
  autoSaved: boolean;
  onPrint?: () => void;
  onDownloadPdf?: () => void;
}

const ReportsShell = ({
  cover,
  dataView,
  autoSaved,
  onPrint,
  onDownloadPdf,
}: ReportsShellProps) => (
  <ReportPreviewShell
    applicationName={cover.applicationName}
    assessmentCode={cover.reportId}
    autoSaved={autoSaved}
    preview={<ReportCover {...cover} />}
    dataView={dataView}
    onPrint={onPrint}
    onDownloadPdf={onDownloadPdf}
  />
);

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
  onPrint,
  onDownloadPdf,
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
  const { clearSelectedVersion } = draftSaveController;

  useEffect(() => {
    builderStateRef.current = builderState;
  }, [builderState]);

  useEffect(() => {
    const restoredState = restoreReportBuilderRouteState(companyId, routeState);

    if (
      JSON.stringify(builderStateRef.current) === JSON.stringify(restoredState)
    ) {
      return;
    }

    clearSelectedVersion();
    builderStateRef.current = restoredState;
    setBuilderState(restoredState);
    setSelectionState(
      createReportBuilderSelectionTreeState(restoredState.selection),
    );
  }, [clearSelectedVersion, companyId, routeState]);

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
    clearSelectedVersion();
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
    clearSelectedVersion();
    setBuilderState(current => {
      const nextState = updateReportBuilderConfiguration(current, {
        includeEvidence,
      });

      builderStateRef.current = nextState;

      return nextState;
    });
  };

  const selectedVersion = draftSaveController.selectedVersion;
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
  const saveDraftDisabledReason = !selectedAssessmentId
    ? 'Select an Assessment before saving a draft.'
    : !hasCurrentAssessmentPreview
      ? previewController.status === 'pending'
        ? 'Wait for the report preview before saving a draft.'
        : 'Generate a report preview before saving a draft.'
      : undefined;

  const reportActionStatus: ReportPreviewShellActionStatus | undefined =
    draftSaveController.message
      ? {
          message: draftSaveController.message,
          role:
            draftSaveController.status === 'conflict' ||
            draftSaveController.status === 'readiness' ||
            draftSaveController.status === 'error'
              ? 'alert'
              : 'status',
        }
      : undefined;

  const assessmentCode = selectedVersion
    ? `${selectedVersion.reportId} · v${formatReportVersionNumber(
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
      reportActions={{
        saveDraft: {
          onActivate: () => {
            void draftSaveController.save();
          },
          isPending: draftSaveController.status === 'pending',
          isDisabled: Boolean(saveDraftDisabledReason),
          disabledReason: saveDraftDisabledReason,
        },
        primaryAction: 'saveDraft',
      }}
      reportActionStatus={reportActionStatus}
      preview={
        <ReportBuilderPreview
          status={displayedStatus}
          snapshot={displayedSnapshot}
          errorMessage={displayedErrorMessage}
          reportId={selectedVersion?.reportId ?? builderState.reportId}
          issuedDate={selectedVersion?.generatedAt}
          onRetry={() => {
            clearSelectedVersion();
            previewController.retry();
          }}
        />
      }
      onPrint={onPrint}
      onDownloadPdf={onDownloadPdf}
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
          onSelectionChange={handleSelectionChange}
          onIncludeEvidenceChange={handleIncludeEvidenceChange}
        />
      }
    />
  );
};

const Reports = ({
  cover = fallbackCover,
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
  onPrint,
  onDownloadPdf,
}: ReportsProps) => {
  if (dataView != null) {
    return (
      <ReportsShell
        cover={cover}
        dataView={dataView}
        autoSaved={autoSaved}
        onPrint={onPrint}
        onDownloadPdf={onDownloadPdf}
      />
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
        onPrint={onPrint}
        onDownloadPdf={onDownloadPdf}
      />
    );
  }

  return (
    <ReportsShell
      cover={cover}
      dataView={<pre>{JSON.stringify(cover, null, 2)}</pre>}
      autoSaved={autoSaved}
      onPrint={onPrint}
      onDownloadPdf={onDownloadPdf}
    />
  );
};

export default Reports;

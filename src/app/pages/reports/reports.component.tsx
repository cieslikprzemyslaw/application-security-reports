import React, { useEffect, useRef, useState } from 'react';

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
import ReportBuilderPreview from './reportBuilderPreview.component';
import { useReportPreviewController } from './reportPreview.controller';
import ReportBuilderTree from './reportBuilderTree.component';

import type { ReportBuilderSelection, ReportBuilderState } from '~/domain';
import type { ReportCoverProps } from '~/app/components/appsec/reportCover';
import type { ReportPreviewShellTab } from '~/app/components/appsec/reportPreviewShell';
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

    builderStateRef.current = restoredState;
    setBuilderState(restoredState);
    setSelectionState(
      createReportBuilderSelectionTreeState(restoredState.selection),
    );
  }, [companyId, routeState]);

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
    setSelectionState(nextSelectionState);
    setBuilderState(current => {
      const nextState = updateReportBuilderSelection(current, {
        selectedAssessmentId: exactSelection.selectedAssessmentId ?? null,
        selectedThreatIds: exactSelection.selectedThreatIds,
        selectedEvidenceIds: exactSelection.selectedEvidenceIds,
      });

      builderStateRef.current = nextState;

      return nextState;
    });
  };

  const handleIncludeEvidenceChange = (includeEvidence: boolean) => {
    setBuilderState(current => {
      const nextState = updateReportBuilderConfiguration(current, {
        includeEvidence,
      });

      builderStateRef.current = nextState;

      return nextState;
    });
  };

  const previewCover = previewController.snapshot
    ? {
        ...cover,
        applicationName:
          previewController.snapshot.assessment.applicationName ??
          previewController.snapshot.assessment.title,
        reportId: previewController.snapshot.assessment.id,
      }
    : cover;

  return (
    <ReportPreviewShell
      applicationName={previewCover.applicationName}
      assessmentCode={previewCover.reportId}
      autoSaved={false}
      activeTab={activeView}
      onActiveTabChange={nextView => onViewChange?.(nextView, builderState)}
      previewTabRef={previewTabRef}
      titleRef={previewHeadingRef}
      preview={
        <ReportBuilderPreview
          status={previewController.status}
          snapshot={previewController.snapshot}
          errorMessage={previewController.errorMessage}
          onRetry={previewController.retry}
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

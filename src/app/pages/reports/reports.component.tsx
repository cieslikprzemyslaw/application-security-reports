import React, { useState } from 'react';

import ReportCover from '~/app/components/appsec/reportCover';
import ReportPreviewShell from '~/app/components/appsec/reportPreviewShell';

import {
  createReportBuilderSelectionTreeState,
  type ReportBuilderSelectionTreeState,
} from './reportBuilderSelectionTree';
import {
  createDefaultReportBuilderState,
  updateReportBuilderConfiguration,
  updateReportBuilderSelection,
} from './reportBuilderState';
import ReportBuilderPreview from './reportBuilderPreview.component';
import { useReportPreviewController } from './reportPreview.controller';
import ReportBuilderTree from './reportBuilderTree.component';

import type { ReportBuilderSelection } from '~/domain';
import type { ReportCoverProps } from '~/app/components/appsec/reportCover';
import type { ReportsProps } from './reports.type';

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
}

const ReportBuilderReports = ({
  cover,
  companyId,
  companyName,
  onPrint,
  onDownloadPdf,
}: ReportBuilderReportsProps) => {
  const [builderState, setBuilderState] = useState(() =>
    createDefaultReportBuilderState(companyId),
  );
  const [selectionState, setSelectionState] =
    useState<ReportBuilderSelectionTreeState>(() =>
      createReportBuilderSelectionTreeState(builderState.selection),
    );
  const previewController = useReportPreviewController(builderState);

  const handleSelectionChange = (
    nextSelectionState: ReportBuilderSelectionTreeState,
    exactSelection: ReportBuilderSelection,
  ) => {
    setSelectionState(nextSelectionState);
    setBuilderState(current =>
      updateReportBuilderSelection(current, {
        selectedAssessmentId: exactSelection.selectedAssessmentId ?? null,
        selectedThreatIds: exactSelection.selectedThreatIds,
        selectedEvidenceIds: exactSelection.selectedEvidenceIds,
      }),
    );
  };

  const handleIncludeEvidenceChange = (includeEvidence: boolean) => {
    setBuilderState(current =>
      updateReportBuilderConfiguration(current, { includeEvidence }),
    );
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

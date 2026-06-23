import React, { useState } from 'react';

import ReportCover from '~/app/components/appsec/reportCover';
import ReportPreviewShell from '~/app/components/appsec/reportPreviewShell';
import {
  createDefaultReportBuilderState,
  updateReportBuilderSelection,
} from './reportBuilderState';
import ReportBuilderTree from './reportBuilderTree.component';

import type { ReportsProps } from './reports.type';
import type { ReportCoverProps } from '~/app/components/appsec/reportCover';
import type { ReportBuilderState } from '~/domain';

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

const toggleIdInSelection = (ids: string[], id: string, selected: boolean) => {
  if (selected) {
    return Array.from(new Set([...ids, id]));
  }

  return ids.filter(item => item !== id);
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
  const [builderState, setBuilderState] = useState<
    ReportBuilderState | undefined
  >(() => (companyId ? createDefaultReportBuilderState(companyId) : undefined));

  const resolvedDataView =
    dataView ??
    (companyId && builderState ? (
      <ReportBuilderTree
        companyId={companyId}
        companyName={companyName ?? cover.companyName}
        selectedAssessmentId={builderState.selection.selectedAssessmentId}
        selectedThreatIds={builderState.selection.selectedThreatIds}
        selectedEvidenceIds={builderState.selection.selectedEvidenceIds}
        onAssessmentSelect={assessmentId => {
          setBuilderState(current =>
            current
              ? updateReportBuilderSelection(current, {
                  selectedAssessmentId: assessmentId,
                })
              : current,
          );
        }}
        onThreatToggle={(threatId, selected) => {
          setBuilderState(current =>
            current
              ? updateReportBuilderSelection(current, {
                  selectedThreatIds: toggleIdInSelection(
                    current.selection.selectedThreatIds,
                    threatId,
                    selected,
                  ),
                })
              : current,
          );
        }}
        onEvidenceToggle={(evidenceId, selected) => {
          setBuilderState(current =>
            current
              ? updateReportBuilderSelection(current, {
                  selectedEvidenceIds: toggleIdInSelection(
                    current.selection.selectedEvidenceIds,
                    evidenceId,
                    selected,
                  ),
                })
              : current,
          );
        }}
      />
    ) : (
      <pre>{JSON.stringify(cover, null, 2)}</pre>
    ));

  return (
    <ReportPreviewShell
      applicationName={cover.applicationName}
      assessmentCode={cover.reportId}
      autoSaved={autoSaved}
      preview={<ReportCover {...cover} />}
      dataView={resolvedDataView}
      onPrint={onPrint}
      onDownloadPdf={onDownloadPdf}
    />
  );
};

export default Reports;

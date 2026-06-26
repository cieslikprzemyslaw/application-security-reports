import { useCallback, useRef } from 'react';

import type { ReportActionsProps } from '~/app/components/appsec/reportActions';
import type {
  ReportPreviewShellActionStatus,
  ReportPreviewShellTab,
} from '~/app/components/appsec/reportPreviewShell';
import type { ReportBuilderState, ReportVersionResponse } from '~/domain';

import {
  createReportPdfDocumentTitle,
  openReportPdfPrintFlow,
} from '../reportDetails/reportPdf';

import type { ReportPreviewControllerStatus } from './reportPreview.controller';

export type ReportSaveStatus =
  | 'idle'
  | 'pending'
  | 'success'
  | 'conflict'
  | 'readiness'
  | 'error';

export interface ReportSaveController {
  status: ReportSaveStatus;
  message?: string;
  save: () => Promise<ReportVersionResponse | undefined>;
}

export type ReportPdfOpener = (documentTitle: string) => void;

interface UseReportActionsControllerOptions {
  activeView: ReportPreviewShellTab;
  builderState: ReportBuilderState;
  previewStatus: ReportPreviewControllerStatus;
  hasCurrentAssessmentPreview: boolean;
  selectedVersion?: ReportVersionResponse;
  draftSaveController: ReportSaveController;
  finalSaveController: ReportSaveController;
  clearDraftSelectedVersion: () => void;
  clearFinalSelectedVersion: () => void;
  clearSelectedVersions: () => void;
  retryPreview: () => void;
  onViewChange?: (
    view: ReportPreviewShellTab,
    state: ReportBuilderState,
  ) => void;
  openPdf?: ReportPdfOpener;
}

export interface ReportActionsControllerState {
  reportActions: ReportActionsProps;
  reportActionStatus?: ReportPreviewShellActionStatus;
}

const formatReportVersionNumber = (version: number): string => {
  const major = Math.floor(version / 10);
  const minor = version % 10;

  return `${major}.${minor}`;
};

const isAlertStatus = (status: ReportSaveStatus): boolean =>
  status === 'conflict' || status === 'readiness' || status === 'error';

export const useReportActionsController = ({
  activeView,
  builderState,
  previewStatus,
  hasCurrentAssessmentPreview,
  selectedVersion,
  draftSaveController,
  finalSaveController,
  clearDraftSelectedVersion,
  clearFinalSelectedVersion,
  clearSelectedVersions,
  retryPreview,
  onViewChange,
  openPdf = openReportPdfPrintFlow,
}: UseReportActionsControllerOptions): ReportActionsControllerState => {
  const saveLockRef = useRef<
    Promise<ReportVersionResponse | undefined> | undefined
  >(undefined);
  const selectedAssessmentId = builderState.selection.selectedAssessmentId;
  const isSavePending =
    draftSaveController.status === 'pending' ||
    finalSaveController.status === 'pending';

  const runSave = useCallback(
    (
      save: () => Promise<ReportVersionResponse | undefined>,
      clearOtherSelectedVersion: () => void,
    ) => {
      if (saveLockRef.current) {
        return;
      }

      clearOtherSelectedVersion();

      const request = save();
      saveLockRef.current = request;

      const releaseLock = () => {
        if (saveLockRef.current === request) {
          saveLockRef.current = undefined;
        }
      };

      void request.then(releaseLock, releaseLock);
    },
    [],
  );

  const handleBackToEditor = useCallback(() => {
    onViewChange?.('data', builderState);
  }, [builderState, onViewChange]);

  const handleGeneratePreview = useCallback(() => {
    if (saveLockRef.current || isSavePending || !selectedAssessmentId) {
      return;
    }

    clearSelectedVersions();
    retryPreview();
    onViewChange?.('preview', builderState);
  }, [
    builderState,
    clearSelectedVersions,
    isSavePending,
    onViewChange,
    retryPreview,
    selectedAssessmentId,
  ]);

  const handleSaveDraft = useCallback(() => {
    runSave(draftSaveController.save, clearFinalSelectedVersion);
  }, [clearFinalSelectedVersion, draftSaveController.save, runSave]);

  const handleSaveFinal = useCallback(() => {
    runSave(finalSaveController.save, clearDraftSelectedVersion);
  }, [clearDraftSelectedVersion, finalSaveController.save, runSave]);

  const handleGeneratePdf = useCallback(() => {
    if (saveLockRef.current || isSavePending || !selectedVersion) {
      return;
    }

    const documentTitle = createReportPdfDocumentTitle({
      companyName: selectedVersion.snapshot.company.name,
      reportTitle: selectedVersion.snapshot.reportTitle ?? 'Security report',
      versionLabel: `v${formatReportVersionNumber(selectedVersion.version)}`,
    });

    openPdf(documentTitle);
  }, [isSavePending, openPdf, selectedVersion]);

  const generatePreviewDisabledReason = isSavePending
    ? 'Wait for the report save to finish.'
    : !selectedAssessmentId
      ? 'Select an Assessment before generating the preview.'
      : previewStatus === 'pending'
        ? 'Wait for the current report preview to finish.'
        : undefined;
  const saveDraftDisabledReason =
    finalSaveController.status === 'pending'
      ? 'Wait for the final version save to finish.'
      : !selectedAssessmentId
        ? 'Select an Assessment before saving a draft.'
        : !hasCurrentAssessmentPreview
          ? previewStatus === 'pending'
            ? 'Wait for the report preview before saving a draft.'
            : 'Generate a report preview before saving a draft.'
          : undefined;
  const saveFinalDisabledReason =
    draftSaveController.status === 'pending'
      ? 'Wait for the draft save to finish.'
      : !selectedAssessmentId
        ? 'Select an Assessment before saving a final version.'
        : !hasCurrentAssessmentPreview
          ? previewStatus === 'pending'
            ? 'Wait for the report preview before saving a final version.'
            : 'Generate a report preview before saving a final version.'
          : undefined;
  const generatePdfDisabledReason = isSavePending
    ? 'Wait for the report save to finish.'
    : !selectedVersion
      ? 'Save and select a report version before generating a PDF.'
      : undefined;
  const activeSaveController = finalSaveController.message
    ? finalSaveController
    : draftSaveController;
  const reportActionStatus: ReportPreviewShellActionStatus | undefined =
    activeSaveController.message
      ? {
          message: activeSaveController.message,
          role: isAlertStatus(activeSaveController.status) ? 'alert' : 'status',
        }
      : undefined;
  const primaryAction =
    activeView === 'data'
      ? 'generatePreview'
      : selectedVersion
        ? 'generatePdf'
        : 'saveDraft';

  return {
    reportActions: {
      backToEditor:
        activeView === 'preview' && onViewChange
          ? {
              onActivate: handleBackToEditor,
            }
          : undefined,
      generatePreview: {
        onActivate: handleGeneratePreview,
        isPending: previewStatus === 'pending',
        isDisabled: Boolean(generatePreviewDisabledReason),
        disabledReason: generatePreviewDisabledReason,
      },
      saveDraft: {
        onActivate: handleSaveDraft,
        isPending: draftSaveController.status === 'pending',
        isDisabled: Boolean(saveDraftDisabledReason),
        disabledReason: saveDraftDisabledReason,
      },
      saveAsFinal: {
        onActivate: handleSaveFinal,
        isPending: finalSaveController.status === 'pending',
        isDisabled: Boolean(saveFinalDisabledReason),
        disabledReason: saveFinalDisabledReason,
      },
      generatePdf: {
        onActivate: handleGeneratePdf,
        isDisabled: Boolean(generatePdfDisabledReason),
        disabledReason: generatePdfDisabledReason,
      },
      primaryAction,
    },
    reportActionStatus,
  };
};

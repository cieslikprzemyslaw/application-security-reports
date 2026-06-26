import { useCallback, useRef } from 'react';

import type { ReportActionsProps } from '~/app/components/appsec/reportActions';
import type {
  ReportPreviewShellActionStatus,
  ReportPreviewShellTab,
} from '~/app/components/appsec/reportPreviewShell';
import type {
  ReportBuilderState,
  ReportReadinessResult,
  ReportVersionResponse,
} from '~/domain';

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

export interface ReportReadinessActionController {
  status: 'idle' | 'pending' | 'success' | 'error';
  result?: ReportReadinessResult;
  message?: string;
  check: () => Promise<ReportReadinessResult | undefined>;
}

export type ReportPdfOpener = (documentTitle: string) => void;

interface UseReportActionsControllerOptions {
  activeView: ReportPreviewShellTab;
  builderState: ReportBuilderState;
  previewStatus: ReportPreviewControllerStatus;
  hasCurrentAssessmentPreview: boolean;
  selectedVersion?: ReportVersionResponse;
  readinessController: ReportReadinessActionController;
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
  readinessController,
  draftSaveController,
  finalSaveController,
  clearDraftSelectedVersion,
  clearFinalSelectedVersion,
  clearSelectedVersions,
  retryPreview,
  onViewChange,
  openPdf = openReportPdfPrintFlow,
}: UseReportActionsControllerOptions): ReportActionsControllerState => {
  const operationLockRef = useRef<Promise<unknown> | undefined>(undefined);
  const selectedAssessmentId = builderState.selection.selectedAssessmentId;
  const isSavePending =
    draftSaveController.status === 'pending' ||
    finalSaveController.status === 'pending';
  const isReadinessPending = readinessController.status === 'pending';
  const isOperationPending = isSavePending || isReadinessPending;
  const readinessHasErrors =
    (readinessController.result?.errors.length ?? 0) > 0;

  const runLocked = useCallback((operation: () => Promise<unknown>) => {
    if (operationLockRef.current) {
      return;
    }

    const request = Promise.resolve().then(operation);
    operationLockRef.current = request;

    const releaseLock = () => {
      if (operationLockRef.current === request) {
        operationLockRef.current = undefined;
      }
    };

    void request.then(releaseLock, releaseLock);
  }, []);

  const handleBackToEditor = useCallback(() => {
    onViewChange?.('data', builderState);
  }, [builderState, onViewChange]);

  const handleGeneratePreview = useCallback(() => {
    if (
      operationLockRef.current ||
      isOperationPending ||
      !selectedAssessmentId
    ) {
      return;
    }

    clearSelectedVersions();
    retryPreview();
    onViewChange?.('preview', builderState);
  }, [
    builderState,
    clearSelectedVersions,
    isOperationPending,
    onViewChange,
    retryPreview,
    selectedAssessmentId,
  ]);

  const handleSaveDraft = useCallback(() => {
    runLocked(async () => {
      clearFinalSelectedVersion();
      return draftSaveController.save();
    });
  }, [clearFinalSelectedVersion, draftSaveController, runLocked]);

  const handleSaveFinal = useCallback(() => {
    runLocked(async () => {
      const readiness = await readinessController.check();

      if (!readiness || readiness.errors.length > 0) {
        return undefined;
      }

      clearDraftSelectedVersion();
      return finalSaveController.save();
    });
  }, [
    clearDraftSelectedVersion,
    finalSaveController,
    readinessController,
    runLocked,
  ]);

  const handleGeneratePdf = useCallback(() => {
    if (operationLockRef.current || isOperationPending || !selectedVersion) {
      return;
    }

    const documentTitle = createReportPdfDocumentTitle({
      companyName: selectedVersion.snapshot.company.name,
      reportTitle: selectedVersion.snapshot.reportTitle ?? 'Security report',
      versionLabel: `v${formatReportVersionNumber(selectedVersion.version)}`,
    });

    openPdf(documentTitle);
  }, [isOperationPending, openPdf, selectedVersion]);

  const generatePreviewDisabledReason = isOperationPending
    ? isReadinessPending
      ? 'Wait for the Report readiness check to finish.'
      : 'Wait for the report save to finish.'
    : !selectedAssessmentId
      ? 'Select an Assessment before generating the preview.'
      : previewStatus === 'pending'
        ? 'Wait for the current report preview to finish.'
        : undefined;
  const saveDraftDisabledReason = isReadinessPending
    ? 'Wait for the Report readiness check to finish.'
    : finalSaveController.status === 'pending'
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
      : readinessHasErrors
        ? 'Resolve the blocking Report readiness issues before saving a final version.'
        : !selectedAssessmentId
          ? 'Select an Assessment before saving a final version.'
          : !hasCurrentAssessmentPreview
            ? previewStatus === 'pending'
              ? 'Wait for the report preview before saving a final version.'
              : 'Generate a report preview before saving a final version.'
            : undefined;
  const generatePdfDisabledReason = isOperationPending
    ? isReadinessPending
      ? 'Wait for the Report readiness check to finish.'
      : 'Wait for the report save to finish.'
    : !selectedVersion
      ? 'Save and select a report version before generating a PDF.'
      : undefined;

  let reportActionStatus: ReportPreviewShellActionStatus | undefined;

  if (
    readinessController.message &&
    (readinessController.status === 'pending' ||
      readinessController.status === 'error')
  ) {
    reportActionStatus = {
      message: readinessController.message,
      role: readinessController.status === 'error' ? 'alert' : 'status',
    };
  } else {
    const activeSaveController = finalSaveController.message
      ? finalSaveController
      : draftSaveController;

    if (activeSaveController.message) {
      reportActionStatus = {
        message: activeSaveController.message,
        role: isAlertStatus(activeSaveController.status) ? 'alert' : 'status',
      };
    } else if (readinessController.message) {
      reportActionStatus = {
        message: readinessController.message,
        role: readinessHasErrors ? 'alert' : 'status',
      };
    }
  }

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
        isPending:
          readinessController.status === 'pending' ||
          finalSaveController.status === 'pending',
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

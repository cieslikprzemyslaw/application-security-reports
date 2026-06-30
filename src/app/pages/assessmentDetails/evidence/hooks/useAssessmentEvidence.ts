import { useState } from 'react';
import type { FormEvent } from 'react';

import type { Evidence } from '~/domain';

import type { AssessmentDetailsAssessment } from '../../assessmentDetails.type';
import type { EvidenceFormValue } from '../form/EvidenceForm.mapper';
import type {
  EvidenceDrawerMode,
  EvidenceFormErrors,
} from '../form/EvidenceForm.types';
import { useEvidenceCollection } from './useEvidenceCollection';
import { useEvidenceDeletion } from './useEvidenceDeletion';
import { useEvidenceDownload } from './useEvidenceDownload';
import { useEvidenceEditor } from './useEvidenceEditor';
import { useEvidenceSubmission } from './useEvidenceSubmission';

export interface AssessmentEvidenceController {
  evidence: Evidence[];
  isLoading: boolean;
  loadError?: string;
  statusMessage?: string;
  drawerMode: EvidenceDrawerMode;
  selectedEvidence?: Evidence;
  selectedEvidenceLoading: boolean;
  selectedEvidenceLoadError?: string;
  draftValue: EvidenceFormValue;
  baselineValue: EvidenceFormValue;
  fieldErrors: EvidenceFormErrors;
  formError?: string;
  isSubmitting: boolean;
  canEditEvidence: boolean;
  deleteTarget?: Evidence;
  isDeleting: boolean;
  deleteError?: string;
  downloadTargetId?: string;
  downloadError?: string;
  openCreateEvidence: () => void;
  openEvidenceDetails: (evidence: Evidence | string) => void;
  openEditEvidence: (evidence?: Evidence | string) => void;
  closeEvidenceDrawer: () => void;
  handleEvidenceChange: (value: EvidenceFormValue) => void;
  handleEvidenceSave: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  downloadAttachment: (evidence: Evidence) => Promise<void>;
  requestDeleteEvidence: (
    evidence?: Evidence,
    invoker?: HTMLElement | null,
  ) => void;
  cancelDeleteEvidence: () => void;
  confirmDeleteEvidence: () => Promise<void>;
  retrySelectedEvidenceLoad: () => void;
  reloadEvidence: () => void;
  setStatusMessage: (value?: string) => void;
}

export const useAssessmentEvidence = ({
  assessmentId,
  assessmentStatus,
  onMutationSuccess,
}: {
  assessmentId?: string;
  assessmentStatus?: AssessmentDetailsAssessment['status'];
  onMutationSuccess?: (delta: number) => void;
}): AssessmentEvidenceController => {
  const collection = useEvidenceCollection(assessmentId);
  const editor = useEvidenceEditor(collection.evidence);
  const download = useEvidenceDownload();
  const [statusMessage, setStatusMessage] = useState<string | undefined>();

  const canEditEvidence = assessmentStatus !== 'archived';

  const deletion = useEvidenceDeletion({
    selectedEvidence: editor.selectedEvidence,
    canEditEvidence,
    onSuccess: () => {
      collection.reloadEvidence();
      setStatusMessage('Evidence deleted.');
      editor.resetEditor();
      download.setDownloadError(undefined);
      onMutationSuccess?.(-1);
    },
  });

  const handleSuccessfulSave = () => {
    const isCreate = editor.drawerMode !== 'edit';
    collection.reloadEvidence();
    setStatusMessage('Evidence saved.');
    editor.resetEditor();
    deletion.resetDeletion();
    download.setDownloadError(undefined);
    if (isCreate) {
      onMutationSuccess?.(1);
    }
  };

  const submission = useEvidenceSubmission({
    assessmentId,
    drawerMode: editor.drawerMode,
    selectedEvidence: editor.selectedEvidence,
    draftValue: editor.draftValue,
    baselineValue: editor.baselineValue,
    setFieldErrors: editor.setFieldErrors,
    setFormError: editor.setFormError,
    onSuccess: handleSuccessfulSave,
  });

  const closeEvidenceDrawer = () => {
    if (submission.isSubmitting || deletion.isDeleting) {
      return;
    }

    if (editor.closeEvidenceDrawer()) {
      deletion.resetDeletion();
      download.setDownloadError(undefined);
    }
  };

  return {
    evidence: collection.evidence,
    isLoading: collection.isLoading,
    loadError: collection.loadError,
    statusMessage,
    drawerMode: editor.drawerMode,
    selectedEvidence: editor.selectedEvidence,
    selectedEvidenceLoading: editor.selectedEvidenceLoading,
    selectedEvidenceLoadError: editor.selectedEvidenceLoadError,
    draftValue: editor.draftValue,
    baselineValue: editor.baselineValue,
    fieldErrors: editor.fieldErrors,
    formError: editor.formError,
    isSubmitting: submission.isSubmitting,
    canEditEvidence,
    deleteTarget: deletion.deleteTarget,
    isDeleting: deletion.isDeleting,
    deleteError: deletion.deleteError,
    downloadTargetId: download.downloadTargetId,
    downloadError: download.downloadError,
    openCreateEvidence: () => {
      if (editor.openCreateEvidence()) {
        setStatusMessage(undefined);
        deletion.resetDeletion();
        download.setDownloadError(undefined);
      }
    },
    openEvidenceDetails: evidence => {
      if (editor.openEvidenceDetails(evidence)) {
        deletion.resetDeletion();
        download.setDownloadError(undefined);
      }
    },
    openEditEvidence: evidence => {
      if (editor.openEditEvidence(evidence)) {
        deletion.resetDeletion();
        download.setDownloadError(undefined);
      }
    },
    closeEvidenceDrawer,
    handleEvidenceChange: value => {
      editor.handleEvidenceChange(value);
      setStatusMessage(undefined);
      download.setDownloadError(undefined);
    },
    handleEvidenceSave: submission.handleEvidenceSave,
    downloadAttachment: download.downloadAttachment,
    requestDeleteEvidence: deletion.requestDeleteEvidence,
    cancelDeleteEvidence: deletion.cancelDeleteEvidence,
    confirmDeleteEvidence: deletion.confirmDeleteEvidence,
    retrySelectedEvidenceLoad: editor.retrySelectedEvidenceLoad,
    reloadEvidence: collection.reloadEvidence,
    setStatusMessage,
  };
};

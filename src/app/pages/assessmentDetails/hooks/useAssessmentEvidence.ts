import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';

import { evidenceService } from '~/services';
import { ApiError } from '~/services/apiClient';
import { formatValidationErrors } from '~/validation';
import {
  createEvidenceRequestSchema,
  updateEvidenceRequestSchema,
} from '~/domain/schemas/request.schema';
import type { Evidence, Threat } from '~/domain';

import {
  areEvidenceFormValuesEqual,
  createEmptyEvidenceFormValue,
  evidenceFormValueToCreateInput,
  evidenceFormValueToUpdateInput,
  evidenceToFormValue,
  type EvidenceFormValue,
} from '../assessmentEvidence.mapper';
import {
  createEmptyEvidenceFormErrors,
  createEvidenceValidationErrorMap,
} from '../assessmentEvidence.validation';
import type {
  EvidenceDrawerMode,
  EvidenceFormErrors,
} from '../assessmentEvidence.types';
import type { AssessmentDetailsAssessment } from '../assessmentDetails.type';

export interface EvidenceThreatOption {
  id: string;
  title: string;
  severity: Threat['severity'];
}

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
  requestDeleteEvidence: () => void;
  cancelDeleteEvidence: () => void;
  confirmDeleteEvidence: () => Promise<void>;
  retrySelectedEvidenceLoad: () => void;
  reloadEvidence: () => void;
  setStatusMessage: (value?: string) => void;
}

const deriveEvidenceId = (evidence: Evidence | string) =>
  typeof evidence === 'string' ? evidence : evidence.id;

export const useAssessmentEvidence = ({
  assessmentId,
  assessmentStatus,
}: {
  assessmentId?: string;
  assessmentStatus?: AssessmentDetailsAssessment['status'];
}): AssessmentEvidenceController => {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const [drawerMode, setDrawerMode] = useState<EvidenceDrawerMode>(null);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string>();
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence>();
  const [selectedEvidenceLoading, setSelectedEvidenceLoading] = useState(false);
  const [selectedEvidenceLoadError, setSelectedEvidenceLoadError] = useState<
    string | undefined
  >();
  const [draftValue, setDraftValue] = useState<EvidenceFormValue>(
    createEmptyEvidenceFormValue(),
  );
  const [baselineValue, setBaselineValue] = useState<EvidenceFormValue>(
    createEmptyEvidenceFormValue(),
  );
  const [fieldErrors, setFieldErrors] = useState<EvidenceFormErrors>(
    createEmptyEvidenceFormErrors(),
  );
  const [formError, setFormError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Evidence>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();
  const [downloadTargetId, setDownloadTargetId] = useState<
    string | undefined
  >();
  const [downloadError, setDownloadError] = useState<string | undefined>();
  const detailRequestTokenRef = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadEvidence = async () => {
      if (!assessmentId) {
        if (isActive) {
          setIsLoading(false);
        }

        return;
      }

      setIsLoading(true);
      setLoadError(undefined);

      try {
        const nextEvidence = await evidenceService.list(
          { assessmentId },
          controller.signal,
        );

        if (isActive) {
          setEvidence(nextEvidence);
        }
      } catch (error) {
        if (
          !isActive ||
          (error instanceof DOMException && error.name === 'AbortError')
        ) {
          return;
        }

        setEvidence([]);
        setLoadError(
          error instanceof Error ? error.message : 'Unable to load evidence.',
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadEvidence();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [assessmentId, reloadKey]);

  useEffect(() => {
    const isDirty =
      drawerMode !== null &&
      drawerMode !== 'view' &&
      !areEvidenceFormValuesEqual(draftValue, baselineValue);

    if (!isDirty) {
      return undefined;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [baselineValue, draftValue, drawerMode]);

  const canEditEvidence = assessmentStatus !== 'archived';

  const selectedEvidenceRecord = useMemo(
    () =>
      evidence.find(item => item.id === selectedEvidenceId) ?? selectedEvidence,
    [evidence, selectedEvidence, selectedEvidenceId],
  );

  const resetDrawerState = () => {
    setDrawerMode(null);
    setSelectedEvidenceId(undefined);
    setSelectedEvidence(undefined);
    setSelectedEvidenceLoading(false);
    setSelectedEvidenceLoadError(undefined);
    setDraftValue(createEmptyEvidenceFormValue());
    setBaselineValue(createEmptyEvidenceFormValue());
    setFieldErrors(createEmptyEvidenceFormErrors());
    setFormError(undefined);
    setIsSubmitting(false);
    setDeleteTarget(undefined);
    setDeleteError(undefined);
    setIsDeleting(false);
    setDownloadTargetId(undefined);
    setDownloadError(undefined);
  };

  const confirmDiscardChanges = () => {
    if (
      drawerMode === null ||
      drawerMode === 'view' ||
      areEvidenceFormValuesEqual(draftValue, baselineValue)
    ) {
      return true;
    }

    return window.confirm('Discard unsaved evidence changes?');
  };

  const loadEvidenceRecord = async (
    evidenceId: string,
    nextMode: Exclude<EvidenceDrawerMode, null>,
  ) => {
    const requestToken = ++detailRequestTokenRef.current;

    setDrawerMode(nextMode);
    setSelectedEvidenceLoading(true);
    setSelectedEvidenceLoadError(undefined);
    setDeleteError(undefined);
    setDownloadTargetId(undefined);
    setDownloadError(undefined);

    try {
      const current = evidence.find(item => item.id === evidenceId);
      const nextEvidence =
        current ?? (await evidenceService.getById(evidenceId));

      if (requestToken !== detailRequestTokenRef.current) {
        return;
      }

      setSelectedEvidenceId(nextEvidence.id);
      setSelectedEvidence(nextEvidence);
      setDrawerMode(nextMode);

      const nextValue = evidenceToFormValue(nextEvidence);

      setDraftValue(nextValue);
      setBaselineValue(nextValue);
      setFieldErrors(createEmptyEvidenceFormErrors());
      setFormError(undefined);
    } catch (error) {
      if (requestToken !== detailRequestTokenRef.current) {
        return;
      }

      setSelectedEvidenceId(evidenceId);
      setSelectedEvidence(undefined);
      setDraftValue(createEmptyEvidenceFormValue());
      setBaselineValue(createEmptyEvidenceFormValue());
      setFieldErrors(createEmptyEvidenceFormErrors());
      setFormError(undefined);
      setSelectedEvidenceLoadError(
        error instanceof ApiError && error.status === 404
          ? 'Evidence not found.'
          : error instanceof Error
            ? error.message
            : 'Unable to load evidence.',
      );
    } finally {
      if (requestToken === detailRequestTokenRef.current) {
        setSelectedEvidenceLoading(false);
      }
    }
  };

  const openCreateEvidence = () => {
    if (!confirmDiscardChanges()) {
      return;
    }

    detailRequestTokenRef.current += 1;
    const value = createEmptyEvidenceFormValue();

    setStatusMessage(undefined);
    setSelectedEvidenceId(undefined);
    setSelectedEvidence(undefined);
    setDrawerMode('create');
    setDraftValue(value);
    setBaselineValue(value);
    setFieldErrors(createEmptyEvidenceFormErrors());
    setFormError(undefined);
    setSelectedEvidenceLoadError(undefined);
    setDeleteTarget(undefined);
    setDeleteError(undefined);
    setDownloadTargetId(undefined);
    setDownloadError(undefined);
  };

  const openEvidenceDetails = (evidenceOrId: Evidence | string) => {
    const evidenceId = deriveEvidenceId(evidenceOrId);

    if (!confirmDiscardChanges()) {
      return;
    }

    void loadEvidenceRecord(evidenceId, 'view');
  };

  const openEditEvidence = (evidenceOrId?: Evidence | string) => {
    const evidenceId =
      evidenceOrId !== undefined
        ? deriveEvidenceId(evidenceOrId)
        : selectedEvidenceRecord?.id;

    if (!evidenceId) {
      return;
    }

    if (!confirmDiscardChanges()) {
      return;
    }

    if (selectedEvidenceRecord?.id === evidenceId) {
      const nextValue = evidenceToFormValue(selectedEvidenceRecord);

      setDrawerMode('edit');
      setDraftValue(nextValue);
      setBaselineValue(nextValue);
      setFieldErrors(createEmptyEvidenceFormErrors());
      setFormError(undefined);
      setSelectedEvidenceLoadError(undefined);
      setDownloadTargetId(undefined);
      setDownloadError(undefined);
      return;
    }

    void loadEvidenceRecord(evidenceId, 'edit');
  };

  const closeEvidenceDrawer = () => {
    if (isSubmitting || isDeleting) {
      return;
    }

    if (!confirmDiscardChanges()) {
      return;
    }

    detailRequestTokenRef.current += 1;
    resetDrawerState();
  };

  const handleEvidenceChange = (value: EvidenceFormValue) => {
    setDraftValue(value);
    setFieldErrors(createEmptyEvidenceFormErrors());
    setFormError(undefined);
    setSelectedEvidenceLoadError(undefined);
    setStatusMessage(undefined);
    setDownloadError(undefined);
  };

  const downloadAttachment = async (evidenceRecord: Evidence) => {
    setDownloadError(undefined);
    setDownloadTargetId(evidenceRecord.id);

    try {
      const latestEvidence = await evidenceService.getById(evidenceRecord.id);

      if (!latestEvidence.filePath) {
        setDownloadError('Attachment is not available for download.');
        return;
      }

      const anchor = document.createElement('a');
      anchor.href = `/${latestEvidence.filePath.replace(/^\/+/, '')}`;
      anchor.download = latestEvidence.fileName ?? 'attachment';
      anchor.rel = 'noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (error) {
      if (error instanceof ApiError) {
        setDownloadError(
          error.status === 404
            ? 'Attachment not found.'
            : error.message || 'Unable to download attachment.',
        );
        return;
      }

      setDownloadError('Unable to download attachment.');
    } finally {
      setDownloadTargetId(undefined);
    }
  };

  const reloadEvidence = () => {
    setReloadKey(key => key + 1);
  };

  const validateAndSubmitEvidence = async (
    requestBody: unknown,
    value: EvidenceFormValue,
    nextMode: 'create' | 'edit',
  ) => {
    const schema =
      nextMode === 'create'
        ? createEvidenceRequestSchema
        : updateEvidenceRequestSchema;
    const parsed = schema.safeParse(requestBody);

    if (!parsed.success) {
      const { fields } = formatValidationErrors(parsed.error);
      const { fieldErrors: nextFieldErrors, generalErrors } =
        createEvidenceValidationErrorMap(fields, value);

      setFieldErrors(nextFieldErrors);
      setFormError(
        generalErrors.length > 0
          ? generalErrors.join(' ')
          : 'Please fix the highlighted fields and try again.',
      );
      return false;
    }

    return true;
  };

  const handleEvidenceSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!assessmentId) {
      return;
    }

    const requestBody =
      drawerMode === 'edit'
        ? evidenceFormValueToUpdateInput(draftValue, {
            shouldClearHttpExchanges:
              baselineValue.type === 'http' && draftValue.type !== 'http',
          })
        : evidenceFormValueToCreateInput(assessmentId, draftValue);

    const nextMode = drawerMode === 'edit' ? 'edit' : 'create';

    if (!(await validateAndSubmitEvidence(requestBody, draftValue, nextMode))) {
      return;
    }

    setIsSubmitting(true);
    setFieldErrors(createEmptyEvidenceFormErrors());
    setFormError(undefined);

    try {
      if (drawerMode === 'edit' && selectedEvidenceRecord) {
        await evidenceService.update(selectedEvidenceRecord.id, requestBody);
      } else {
        await evidenceService.create(requestBody);
      }

      reloadEvidence();
      setStatusMessage('Evidence saved.');
      resetDrawerState();
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        const { fieldErrors: nextFieldErrors, generalErrors } =
          createEvidenceValidationErrorMap(error.details, draftValue);

        setFieldErrors(nextFieldErrors);
        setFormError(
          generalErrors.length > 0
            ? generalErrors.join(' ')
            : 'Please fix the highlighted fields and try again.',
        );
      } else {
        setFormError(
          error instanceof Error ? error.message : 'Unable to save evidence.',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestDeleteEvidence = () => {
    if (!selectedEvidenceRecord || !canEditEvidence) {
      return;
    }

    setDeleteTarget(selectedEvidenceRecord);
    setDeleteError(undefined);
  };

  const cancelDeleteEvidence = () => {
    if (isDeleting) {
      return;
    }

    setDeleteTarget(undefined);
    setDeleteError(undefined);
  };

  const confirmDeleteEvidence = async () => {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(undefined);

    try {
      await evidenceService.remove(deleteTarget.id);
      reloadEvidence();
      setStatusMessage('Evidence deleted.');
      setDeleteTarget(undefined);
      resetDrawerState();
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : 'Unable to delete evidence.',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const retrySelectedEvidenceLoad = () => {
    if (!selectedEvidenceId || drawerMode === null) {
      return;
    }

    void loadEvidenceRecord(
      selectedEvidenceId,
      drawerMode as Exclude<EvidenceDrawerMode, null>,
    );
  };

  return {
    evidence,
    isLoading,
    loadError,
    statusMessage,
    drawerMode,
    selectedEvidence: selectedEvidenceRecord,
    selectedEvidenceLoading,
    selectedEvidenceLoadError,
    draftValue,
    baselineValue,
    fieldErrors,
    formError,
    isSubmitting,
    canEditEvidence,
    deleteTarget,
    isDeleting,
    deleteError,
    downloadTargetId,
    downloadError,
    openCreateEvidence,
    openEvidenceDetails,
    openEditEvidence,
    closeEvidenceDrawer,
    handleEvidenceChange,
    handleEvidenceSave,
    downloadAttachment,
    requestDeleteEvidence,
    cancelDeleteEvidence,
    confirmDeleteEvidence,
    retrySelectedEvidenceLoad,
    reloadEvidence,
    setStatusMessage,
  };
};

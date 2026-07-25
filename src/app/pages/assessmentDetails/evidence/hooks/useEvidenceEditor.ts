import { useMemo, useRef, useState } from 'react';

import type { Evidence } from '~/domain';
import { evidenceService } from '~/services';
import { useDirtyFormGuard } from '~/app/hooks/useDirtyFormGuard';
import { ApiError } from '~/services/apiClient';

import {
  areEvidenceFormValuesEqual,
  createEmptyEvidenceFormValue,
  evidenceToFormValue,
  type EvidenceFormValue,
} from '../form/EvidenceForm.mapper';
import { createEmptyEvidenceFormErrors } from '../form/EvidenceForm.validation';
import type {
  EvidenceDrawerMode,
  EvidenceFormErrors,
} from '../form/EvidenceForm.types';

const deriveEvidenceId = (evidence: Evidence | string) =>
  typeof evidence === 'string' ? evidence : evidence.id;

export const useEvidenceEditor = (evidence: Evidence[]) => {
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
  const detailRequestTokenRef = useRef(0);

  const selectedEvidenceRecord = useMemo(
    () =>
      evidence.find(item => item.id === selectedEvidenceId) ?? selectedEvidence,
    [evidence, selectedEvidence, selectedEvidenceId],
  );

  const isDirty =
    drawerMode !== null &&
    drawerMode !== 'view' &&
    !areEvidenceFormValuesEqual(draftValue, baselineValue);

  const dirtyFormGuard = useDirtyFormGuard(isDirty);

  const clearFormFeedback = () => {
    setFieldErrors(createEmptyEvidenceFormErrors());
    setFormError(undefined);
    setSelectedEvidenceLoadError(undefined);
  };

  const resetEditor = () => {
    setDrawerMode(null);
    setSelectedEvidenceId(undefined);
    setSelectedEvidence(undefined);
    setSelectedEvidenceLoading(false);
    setSelectedEvidenceLoadError(undefined);
    setDraftValue(createEmptyEvidenceFormValue());
    setBaselineValue(createEmptyEvidenceFormValue());
    setFieldErrors(createEmptyEvidenceFormErrors());
    setFormError(undefined);
  };

  const cancelPendingDetailLoad = () => {
    detailRequestTokenRef.current += 1;
  };

  const loadEvidenceRecord = async (
    evidenceId: string,
    nextMode: Exclude<EvidenceDrawerMode, null>,
  ) => {
    const requestToken = ++detailRequestTokenRef.current;

    setDrawerMode(nextMode);
    setSelectedEvidenceLoading(true);
    setSelectedEvidenceLoadError(undefined);

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

  const openCreateEvidence = (onOpen?: () => void) =>
    dirtyFormGuard.requestDiscard(() => {
      cancelPendingDetailLoad();
      const value = createEmptyEvidenceFormValue();

      setSelectedEvidenceId(undefined);
      setSelectedEvidence(undefined);
      setDrawerMode('create');
      setDraftValue(value);
      setBaselineValue(value);
      clearFormFeedback();
      onOpen?.();
    });

  const openEvidenceDetails = (
    evidenceOrId: Evidence | string,
    onOpen?: () => void,
  ) =>
    dirtyFormGuard.requestDiscard(() => {
      void loadEvidenceRecord(deriveEvidenceId(evidenceOrId), 'view');
      onOpen?.();
    });

  const openEditEvidence = (
    evidenceOrId?: Evidence | string,
    onOpen?: () => void,
  ) => {
    const evidenceId =
      evidenceOrId !== undefined
        ? deriveEvidenceId(evidenceOrId)
        : selectedEvidenceRecord?.id;

    if (!evidenceId) {
      return false;
    }

    return dirtyFormGuard.requestDiscard(() => {
      if (selectedEvidenceRecord?.id === evidenceId) {
        const nextValue = evidenceToFormValue(selectedEvidenceRecord);

        setDrawerMode('edit');
        setDraftValue(nextValue);
        setBaselineValue(nextValue);
        clearFormFeedback();
        onOpen?.();
        return;
      }

      void loadEvidenceRecord(evidenceId, 'edit');
      onOpen?.();
    });
  };

  const closeEvidenceDrawer = (onClose?: () => void) =>
    dirtyFormGuard.requestDiscard(() => {
      cancelPendingDetailLoad();
      resetEditor();
      onClose?.();
    });

  const handleEvidenceChange = (value: EvidenceFormValue) => {
    setDraftValue(value);
    clearFormFeedback();
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
    drawerMode,
    selectedEvidence: selectedEvidenceRecord,
    selectedEvidenceLoading,
    selectedEvidenceLoadError,
    draftValue,
    baselineValue,
    fieldErrors,
    formError,
    selectedEvidenceId,
    setFieldErrors,
    setFormError,
    setDraftValue,
    setBaselineValue,
    clearFormFeedback,
    resetEditor,
    openCreateEvidence,
    openEvidenceDetails,
    openEditEvidence,
    closeEvidenceDrawer,
    handleEvidenceChange,
    retrySelectedEvidenceLoad,
    dirtyFormGuard,
  };
};

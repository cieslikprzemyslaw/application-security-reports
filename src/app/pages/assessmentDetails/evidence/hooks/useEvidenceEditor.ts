import { useEffect, useMemo, useRef, useState } from 'react';

import type { Evidence } from '~/domain';
import { evidenceService } from '~/services';
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

  useEffect(() => {
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
  }, [isDirty]);

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

  const confirmDiscardChanges = () => {
    if (!isDirty) {
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
      return false;
    }

    cancelPendingDetailLoad();
    const value = createEmptyEvidenceFormValue();

    setSelectedEvidenceId(undefined);
    setSelectedEvidence(undefined);
    setDrawerMode('create');
    setDraftValue(value);
    setBaselineValue(value);
    clearFormFeedback();

    return true;
  };

  const openEvidenceDetails = (evidenceOrId: Evidence | string) => {
    if (!confirmDiscardChanges()) {
      return false;
    }

    void loadEvidenceRecord(deriveEvidenceId(evidenceOrId), 'view');
    return true;
  };

  const openEditEvidence = (evidenceOrId?: Evidence | string) => {
    const evidenceId =
      evidenceOrId !== undefined
        ? deriveEvidenceId(evidenceOrId)
        : selectedEvidenceRecord?.id;

    if (!evidenceId || !confirmDiscardChanges()) {
      return false;
    }

    if (selectedEvidenceRecord?.id === evidenceId) {
      const nextValue = evidenceToFormValue(selectedEvidenceRecord);

      setDrawerMode('edit');
      setDraftValue(nextValue);
      setBaselineValue(nextValue);
      clearFormFeedback();
      return true;
    }

    void loadEvidenceRecord(evidenceId, 'edit');
    return true;
  };

  const closeEvidenceDrawer = () => {
    if (!confirmDiscardChanges()) {
      return false;
    }

    cancelPendingDetailLoad();
    resetEditor();
    return true;
  };

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
  };
};

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';

import { threatService } from '~/services';
import { ApiError } from '~/services/apiClient';
import type { Threat } from '~/domain';

import type { ThreatFormValue } from '~/app/components/appsec/threatForm';
import type { ThreatTableRow } from '~/app/components/appsec/threatTable';

import type { AssessmentDetailsAssessment } from '../assessmentDetails.type';
import {
  areThreatFormValuesEqual,
  createThreatValidationErrorMap,
  getThreatValidationErrors,
  type ThreatFormErrors,
} from '../assessmentDetails.validation';
import {
  createEmptyThreatFormValue,
  threatFormValueToCreateInput,
  threatFormValueToUpdateInput,
  threatToFormValue,
} from '../assessmentDetails.mapper';

export type FindingDrawerMode = 'view' | 'create' | 'edit' | null;

export interface AssessmentFindingsController {
  threats: Threat[];
  isLoading: boolean;
  loadError?: string;
  drawerMode: FindingDrawerMode;
  selectedFinding?: Threat;
  draftValue: ThreatFormValue;
  fieldErrors: ThreatFormErrors;
  formError?: string;
  isSubmitting: boolean;
  canEditFindings: boolean;
  openCreateFinding: () => void;
  openEditFinding: (threat?: Threat | ThreatTableRow) => void;
  openFindingDetails: (threat: Threat | ThreatTableRow) => void;
  closeFindingDrawer: () => void;
  handleFindingChange: (value: ThreatFormValue) => void;
  handleFindingSave: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}

export const useAssessmentFindings = ({
  assessmentId,
  assessmentStatus,
}: {
  assessmentId?: string;
  assessmentStatus?: AssessmentDetailsAssessment['status'];
}): AssessmentFindingsController => {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);
  const [drawerMode, setDrawerMode] = useState<FindingDrawerMode>(null);
  const [selectedFindingId, setSelectedFindingId] = useState<string>();
  const [draftValue, setDraftValue] = useState(createEmptyThreatFormValue());
  const [baselineValue, setBaselineValue] = useState(draftValue);
  const [fieldErrors, setFieldErrors] = useState<ThreatFormErrors>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadFindings = async () => {
      if (!assessmentId) {
        if (isActive) {
          setIsLoading(false);
        }

        return;
      }

      setIsLoading(true);
      setLoadError(undefined);

      try {
        const nextFindings = await threatService.listByAssessment(
          assessmentId,
          controller.signal,
        );

        if (isActive) {
          setThreats(nextFindings);
        }
      } catch (error) {
        if (
          !isActive ||
          (error instanceof DOMException && error.name === 'AbortError')
        ) {
          return;
        }

        setThreats([]);
        setLoadError(
          error instanceof Error ? error.message : 'Unable to load findings.',
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadFindings();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [assessmentId, reloadKey]);

  useEffect(() => {
    const isDirty =
      drawerMode !== null &&
      drawerMode !== 'view' &&
      !areThreatFormValuesEqual(draftValue, baselineValue);

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

  const selectedFinding = useMemo(
    () => threats.find(threat => threat.id === selectedFindingId),
    [selectedFindingId, threats],
  );

  const resetDrawerState = () => {
    setDrawerMode(null);
    setSelectedFindingId(undefined);
    setDraftValue(createEmptyThreatFormValue());
    setBaselineValue(createEmptyThreatFormValue());
    setFieldErrors({});
    setFormError(undefined);
    setIsSubmitting(false);
  };

  const confirmDiscardChanges = () => {
    if (
      drawerMode === null ||
      drawerMode === 'view' ||
      areThreatFormValuesEqual(draftValue, baselineValue)
    ) {
      return true;
    }

    return window.confirm('Discard unsaved finding changes?');
  };

  const openCreateFinding = () => {
    if (!confirmDiscardChanges()) {
      return;
    }

    const value = createEmptyThreatFormValue();

    setSelectedFindingId(undefined);
    setDrawerMode('create');
    setDraftValue(value);
    setBaselineValue(value);
    setFieldErrors({});
    setFormError(undefined);
  };

  const openFindingDetails = (threat: Threat | ThreatTableRow) => {
    const finding =
      'strideCategories' in threat
        ? threat
        : threats.find(item => item.id === threat.id);

    if (!finding) {
      return;
    }

    if (!confirmDiscardChanges()) {
      return;
    }

    const value = threatToFormValue(finding);

    setSelectedFindingId(finding.id);
    setDrawerMode('view');
    setDraftValue(value);
    setBaselineValue(value);
    setFieldErrors({});
    setFormError(undefined);
  };

  const openEditFinding = (threat?: Threat | ThreatTableRow) => {
    const finding =
      threat && 'strideCategories' in threat
        ? threat
        : threat
          ? threats.find(item => item.id === threat.id)
          : selectedFinding;

    if (!finding) {
      return;
    }

    if (!confirmDiscardChanges()) {
      return;
    }

    const value = threatToFormValue(finding);

    setSelectedFindingId(finding.id);
    setDrawerMode('edit');
    setDraftValue(value);
    setBaselineValue(value);
    setFieldErrors({});
    setFormError(undefined);
  };

  const closeFindingDrawer = () => {
    if (isSubmitting) {
      return;
    }

    if (!confirmDiscardChanges()) {
      return;
    }

    resetDrawerState();
  };

  const handleFindingSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!assessmentId) {
      return;
    }

    const validationErrors = getThreatValidationErrors(draftValue);

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setFormError('Please fix the highlighted fields and try again.');
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    setFormError(undefined);

    try {
      if (drawerMode === 'edit' && selectedFindingId) {
        await threatService.update(
          selectedFindingId,
          threatFormValueToUpdateInput(draftValue),
        );
      } else {
        await threatService.create(
          threatFormValueToCreateInput(assessmentId, draftValue),
        );
      }

      setReloadKey(key => key + 1);
      resetDrawerState();
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        const { fieldErrors: nextFieldErrors, generalErrors } =
          createThreatValidationErrorMap(error.details);

        setFieldErrors(nextFieldErrors);
        setFormError(
          generalErrors.length > 0
            ? generalErrors.join(' ')
            : 'Please fix the highlighted fields and try again.',
        );
      } else {
        setFormError(
          error instanceof Error ? error.message : 'Unable to save finding.',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFindingChange = (value: ThreatFormValue) => {
    setDraftValue(value);
    setFieldErrors({});
    setFormError(undefined);
  };

  return {
    threats,
    isLoading,
    loadError,
    drawerMode,
    selectedFinding,
    draftValue,
    fieldErrors,
    formError,
    isSubmitting,
    canEditFindings: assessmentStatus !== 'archived',
    openCreateFinding,
    openEditFinding,
    openFindingDetails,
    closeFindingDrawer,
    handleFindingChange,
    handleFindingSave,
  };
};

import { useEffect, useState } from 'react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';

import {
  assessmentFormValueToCreateInput,
  assessmentFormValueToUpdateInput,
  assessmentToFormValue,
  areAssessmentFormValuesEqual,
  createEmptyAssessmentFormValue,
  validateAssessmentFormValue,
} from '~/app/components/appsec/assessmentForm';
import type { AssessmentListItem } from '~/services';
import { assessmentService } from '~/services';
import { ApiError } from '~/services/apiClient';

import { createAssessmentValidationErrorMap } from './assessments.utils';

type AssessmentFormValue = ReturnType<typeof createEmptyAssessmentFormValue>;

export interface AssessmentDrawerController {
  drawerMode: 'create' | 'edit' | null;
  draftValue: AssessmentFormValue;
  fieldErrors: Record<string, string>;
  formErrorMessage?: string;
  isSubmitting: boolean;
  setDraftValue: Dispatch<SetStateAction<AssessmentFormValue>>;
  openCreateDrawer: () => void;
  openEditDrawer: (assessment: AssessmentListItem) => void;
  requestCloseDrawer: () => void;
  handleSave: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}

export const useAssessmentDrawerController = ({
  companyId,
  reloadAssessments,
}: {
  companyId: string;
  reloadAssessments: () => void;
}): AssessmentDrawerController => {
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | null>(null);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<
    string | undefined
  >();
  const [draftValue, setDraftValue] = useState(
    createEmptyAssessmentFormValue(),
  );
  const [baselineValue, setBaselineValue] = useState(draftValue);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<string, string>>
  >({});
  const [formErrorMessage, setFormErrorMessage] = useState<
    string | undefined
  >();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasUnsavedChanges =
    drawerMode !== null &&
    !areAssessmentFormValuesEqual(draftValue, baselineValue);

  useEffect(() => {
    if (!hasUnsavedChanges) {
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
  }, [hasUnsavedChanges]);

  const resetDrawerState = () => {
    setDrawerMode(null);
    setSelectedAssessmentId(undefined);
    setDraftValue(createEmptyAssessmentFormValue());
    setBaselineValue(createEmptyAssessmentFormValue());
    setFieldErrors({});
    setFormErrorMessage(undefined);
    setIsSubmitting(false);
  };

  const confirmDiscardChanges = () => {
    if (!hasUnsavedChanges) {
      return true;
    }

    return window.confirm('Discard unsaved assessment changes?');
  };

  const openCreateDrawer = () => {
    if (!confirmDiscardChanges()) {
      return;
    }

    const value = createEmptyAssessmentFormValue();
    setDrawerMode('create');
    setSelectedAssessmentId(undefined);
    setDraftValue(value);
    setBaselineValue(value);
    setFieldErrors({});
    setFormErrorMessage(undefined);
  };

  const openEditDrawer = (assessment: AssessmentListItem) => {
    if (!confirmDiscardChanges()) {
      return;
    }

    const value = assessmentToFormValue({
      title: assessment.name,
      assessmentType: assessment.type,
      description: assessment.description,
      scope: assessment.scope,
      status: assessment.status,
    });

    setDrawerMode('edit');
    setSelectedAssessmentId(assessment.id);
    setDraftValue(value);
    setBaselineValue(value);
    setFieldErrors({});
    setFormErrorMessage(undefined);
  };

  const requestCloseDrawer = () => {
    if (isSubmitting) {
      return;
    }

    if (!confirmDiscardChanges()) {
      return;
    }

    resetDrawerState();
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateAssessmentFormValue(
      draftValue,
      drawerMode === 'create' ? 'create' : 'edit',
    );

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setFormErrorMessage('Please fix the highlighted fields and try again.');
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    setFormErrorMessage(undefined);

    try {
      if (drawerMode === 'edit' && selectedAssessmentId) {
        await assessmentService.update(
          selectedAssessmentId,
          assessmentFormValueToUpdateInput(draftValue),
        );
      } else {
        await assessmentService.create(
          assessmentFormValueToCreateInput(companyId, draftValue),
        );
      }

      reloadAssessments();
      resetDrawerState();
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        const { fieldErrors: nextFieldErrors, generalErrors } =
          createAssessmentValidationErrorMap(
            error.details,
            draftValue.typeMode,
          );

        setFieldErrors(nextFieldErrors);
        setFormErrorMessage(
          generalErrors.length > 0
            ? generalErrors.join(' ')
            : 'Please fix the highlighted fields and try again.',
        );
      } else {
        setFormErrorMessage(
          error instanceof Error ? error.message : 'Unable to save assessment.',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    drawerMode,
    draftValue,
    fieldErrors,
    formErrorMessage,
    isSubmitting,
    setDraftValue,
    openCreateDrawer,
    openEditDrawer,
    requestCloseDrawer,
    handleSave,
  };
};

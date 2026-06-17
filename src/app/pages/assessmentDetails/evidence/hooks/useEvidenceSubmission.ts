import { useState } from 'react';
import type { FormEvent } from 'react';

import { evidenceService } from '~/services';
import { ApiError } from '~/services/apiClient';
import {
  createEvidenceRequestSchema,
  updateEvidenceRequestSchema,
} from '~/domain/schemas/request.schema';
import { formatValidationErrors } from '~/validation';
import type { Evidence } from '~/domain';

import {
  evidenceFormValueToCreateInput,
  evidenceFormValueToUpdateInput,
  type EvidenceFormValue,
} from '../form/EvidenceForm.mapper';
import {
  createEmptyEvidenceFormErrors,
  createEvidenceValidationErrorMap,
} from '../form/EvidenceForm.validation';
import type {
  EvidenceDrawerMode,
  EvidenceFormErrors,
} from '../form/EvidenceForm.types';

interface UseEvidenceSubmissionOptions {
  assessmentId?: string;
  drawerMode: EvidenceDrawerMode;
  selectedEvidence?: Evidence;
  draftValue: EvidenceFormValue;
  baselineValue: EvidenceFormValue;
  setFieldErrors: (errors: EvidenceFormErrors) => void;
  setFormError: (error?: string) => void;
  onSuccess: () => void;
}

export const useEvidenceSubmission = ({
  assessmentId,
  drawerMode,
  selectedEvidence,
  draftValue,
  baselineValue,
  setFieldErrors,
  setFormError,
  onSuccess,
}: UseEvidenceSubmissionOptions) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    const nextMode = drawerMode === 'edit' ? 'edit' : 'create';
    const createRequestBody =
      drawerMode !== 'edit'
        ? evidenceFormValueToCreateInput(assessmentId, draftValue)
        : undefined;
    const updateRequestBody =
      drawerMode === 'edit'
        ? evidenceFormValueToUpdateInput(draftValue, {
            shouldClearHttpExchanges:
              baselineValue.type === 'http' && draftValue.type !== 'http',
          })
        : undefined;

    if (
      !(await validateAndSubmitEvidence(
        createRequestBody ?? updateRequestBody,
        draftValue,
        nextMode,
      ))
    ) {
      return;
    }

    setIsSubmitting(true);
    setFieldErrors(createEmptyEvidenceFormErrors());
    setFormError(undefined);

    try {
      if (drawerMode === 'edit' && selectedEvidence) {
        await evidenceService.update(
          selectedEvidence.id,
          updateRequestBody as NonNullable<typeof updateRequestBody>,
        );
      } else {
        await evidenceService.create(
          createRequestBody as NonNullable<typeof createRequestBody>,
        );
      }

      onSuccess();
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

  return {
    isSubmitting,
    handleEvidenceSave,
  };
};

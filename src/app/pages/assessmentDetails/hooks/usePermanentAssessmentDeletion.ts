import { useMemo, useRef, useState } from 'react';

import { assessmentService } from '~/services';
import { ApiError } from '~/services/apiClient';

import type { AssessmentDetailsAssessment } from '../assessmentDetails.type';

const genericDeleteError =
  'Unable to permanently delete this Assessment. Please try again.';

const conflictDeleteError =
  'This Assessment could not be permanently deleted because related records still depend on it.';

const notArchivedDeleteError =
  'Only archived Assessments can be permanently deleted.';

const unsafeStorageDetailPattern =
  /(storageKey|filePath|filesystem path|internal storage|[A-Za-z]:\\|\\|\/)/i;

const scheduleFocus = (focusTarget: () => HTMLElement | null | undefined) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.setTimeout(() => {
    const target = focusTarget();

    if (target?.isConnected) {
      target.focus();
    }
  }, 0);
};

const getDeleteErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return conflictDeleteError;
    }

    if (error.status === 404) {
      return 'This Assessment no longer exists.';
    }

    return error.message || genericDeleteError;
  }

  return error instanceof Error && error.message.trim().length > 0
    ? error.message
    : genericDeleteError;
};

const getAssessmentDeleteName = (assessment: AssessmentDetailsAssessment) => {
  const title = assessment.title?.trim();

  if (title && title.length > 0) {
    return title;
  }

  return assessment.applicationName.trim();
};

const normaliseCleanupWarnings = (warnings: string[] | undefined) =>
  (warnings ?? [])
    .map(warning => warning.trim())
    .filter(
      warning =>
        warning.length > 0 && !unsafeStorageDetailPattern.test(warning),
    );

export interface PermanentAssessmentDeletionController {
  deleteTarget?: AssessmentDetailsAssessment;
  deleteTargetName: string;
  confirmationValue: string;
  cleanupWarnings: string[];
  deleteError?: string;
  isDeleting: boolean;
  isConfirmationValid: boolean;
  requestPermanentDelete: (
    assessment: AssessmentDetailsAssessment,
    invoker?: HTMLElement | null,
  ) => void;
  cancelPermanentDelete: () => void;
  setConfirmationValue: (value: string) => void;
  confirmPermanentDelete: () => Promise<void>;
}

export const usePermanentAssessmentDeletion = ({
  onDeleted,
}: {
  onDeleted: (result: {
    assessment: AssessmentDetailsAssessment;
    cleanupWarnings: string[];
  }) => void;
}): PermanentAssessmentDeletionController => {
  const [deleteTarget, setDeleteTarget] = useState<
    AssessmentDetailsAssessment | undefined
  >();
  const [confirmationValue, setConfirmationValue] = useState('');
  const [cleanupWarnings, setCleanupWarnings] = useState<string[]>([]);
  const [deleteError, setDeleteError] = useState<string | undefined>();
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteInvokerRef = useRef<HTMLElement | null>(null);

  const deleteTargetName = useMemo(
    () => (deleteTarget ? getAssessmentDeleteName(deleteTarget) : ''),
    [deleteTarget],
  );
  const isConfirmationValid =
    Boolean(deleteTarget) && confirmationValue === deleteTargetName;

  const reset = () => {
    setDeleteTarget(undefined);
    setConfirmationValue('');
    setCleanupWarnings([]);
    setDeleteError(undefined);
  };

  const requestPermanentDelete = (
    assessment: AssessmentDetailsAssessment,
    invoker?: HTMLElement | null,
  ) => {
    if (assessment.status !== 'archived') {
      setDeleteError(notArchivedDeleteError);
      return;
    }

    deleteInvokerRef.current =
      invoker ??
      (document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null);

    setDeleteTarget(assessment);
    setConfirmationValue('');
    setCleanupWarnings([]);
    setDeleteError(undefined);
  };

  const cancelPermanentDelete = () => {
    if (isDeleting) {
      return;
    }

    const invoker = deleteInvokerRef.current;

    reset();
    deleteInvokerRef.current = null;
    scheduleFocus(() => invoker);
  };

  const confirmPermanentDelete = async () => {
    if (!deleteTarget || !isConfirmationValid || isDeleting) {
      return;
    }

    const target = deleteTarget;

    setIsDeleting(true);
    setCleanupWarnings([]);
    setDeleteError(undefined);

    try {
      const result = await assessmentService.remove(target.id);
      const safeCleanupWarnings = normaliseCleanupWarnings(
        result.cleanupWarnings,
      );

      setIsDeleting(false);
      reset();
      deleteInvokerRef.current = null;
      onDeleted({ assessment: target, cleanupWarnings: safeCleanupWarnings });
    } catch (error) {
      setDeleteError(getDeleteErrorMessage(error));
      setIsDeleting(false);
      scheduleFocus(() =>
        document.querySelector<HTMLButtonElement>(
          '[data-assessment-permanent-delete-confirm]',
        ),
      );
    }
  };

  return {
    deleteTarget,
    deleteTargetName,
    confirmationValue,
    cleanupWarnings,
    deleteError,
    isDeleting,
    isConfirmationValid,
    requestPermanentDelete,
    cancelPermanentDelete,
    setConfirmationValue,
    confirmPermanentDelete,
  };
};

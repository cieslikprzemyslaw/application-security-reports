import { useMemo, useRef, useState } from 'react';

import type { AssessmentDeletionImpact } from '~/domain';
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
  deletionImpact?: AssessmentDeletionImpact;
  cleanupWarnings: string[];
  impactError?: string;
  deleteError?: string;
  isLoadingImpact: boolean;
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
  const [deletionImpact, setDeletionImpact] =
    useState<AssessmentDeletionImpact>();
  const [cleanupWarnings, setCleanupWarnings] = useState<string[]>([]);
  const [impactError, setImpactError] = useState<string | undefined>();
  const [deleteError, setDeleteError] = useState<string | undefined>();
  const [isLoadingImpact, setIsLoadingImpact] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteInvokerRef = useRef<HTMLElement | null>(null);
  const impactRequestRef = useRef<AbortController | undefined>(undefined);

  const deleteTargetName = useMemo(
    () => (deleteTarget ? getAssessmentDeleteName(deleteTarget) : ''),
    [deleteTarget],
  );
  const isConfirmationValid =
    Boolean(deleteTarget) &&
    deletionImpact?.canDelete === true &&
    confirmationValue === deleteTargetName;

  const reset = () => {
    setDeleteTarget(undefined);
    setConfirmationValue('');
    setDeletionImpact(undefined);
    setCleanupWarnings([]);
    setImpactError(undefined);
    setDeleteError(undefined);
    setIsLoadingImpact(false);
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

    impactRequestRef.current?.abort();
    const controller = new AbortController();
    impactRequestRef.current = controller;

    setDeleteTarget(assessment);
    setConfirmationValue('');
    setDeletionImpact(undefined);
    setCleanupWarnings([]);
    setImpactError(undefined);
    setDeleteError(undefined);
    setIsLoadingImpact(true);

    void assessmentService
      .getDeletionImpact(assessment.id, controller.signal)
      .then(impact => {
        if (!controller.signal.aborted) {
          setDeletionImpact(impact);
        }
      })
      .catch(error => {
        if (!controller.signal.aborted) {
          setImpactError(
            error instanceof Error && error.message.trim().length > 0
              ? error.message
              : 'Unable to load deletion impact.',
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingImpact(false);
        }
      });
  };

  const cancelPermanentDelete = () => {
    if (isDeleting) {
      return;
    }

    const invoker = deleteInvokerRef.current;

    impactRequestRef.current?.abort();
    impactRequestRef.current = undefined;
    reset();
    deleteInvokerRef.current = null;
    scheduleFocus(() => invoker);
  };

  const confirmPermanentDelete = async () => {
    if (
      !deleteTarget ||
      !deletionImpact ||
      !isConfirmationValid ||
      isDeleting
    ) {
      return;
    }

    const target = deleteTarget;

    setIsDeleting(true);
    setCleanupWarnings([]);
    setDeleteError(undefined);

    try {
      const result = await assessmentService.remove(
        target.id,
        deletionImpact.recordVersion,
      );
      const safeCleanupWarnings = normaliseCleanupWarnings(
        result.cleanupWarnings,
      );

      setIsDeleting(false);
      reset();
      impactRequestRef.current = undefined;
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
    deletionImpact,
    cleanupWarnings,
    impactError,
    deleteError,
    isLoadingImpact,
    isDeleting,
    isConfirmationValid,
    requestPermanentDelete,
    cancelPermanentDelete,
    setConfirmationValue,
    confirmPermanentDelete,
  };
};

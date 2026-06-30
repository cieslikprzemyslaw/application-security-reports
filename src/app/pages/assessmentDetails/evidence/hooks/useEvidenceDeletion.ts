import { useRef, useState } from 'react';

import type { Evidence } from '~/domain';
import { evidenceService } from '~/services';

const genericDeleteError = 'Unable to delete evidence. Please try again.';

const conflictDeleteError =
  'Evidence could not be deleted because it is still in use. Remove dependent links and try again.';

const getDeleteErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : '';

  if (/409|conflict|in use|linked|relationship/i.test(message)) {
    return conflictDeleteError;
  }

  return genericDeleteError;
};

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

const focusNextEvidenceAction = (deletedEvidenceId: string) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  let attempts = 0;

  const focus = () => {
    const nextEvidenceAction = Array.from(
      document.querySelectorAll<HTMLButtonElement>(
        '[data-evidence-open-action]',
      ),
    ).find(button => button.dataset.evidenceOpenAction !== deletedEvidenceId);

    const addEvidenceAction = document.querySelector<HTMLButtonElement>(
      '[data-evidence-add-action="true"]',
    );

    const target = nextEvidenceAction ?? addEvidenceAction;

    if (target?.isConnected) {
      target.focus();
      return;
    }

    if (attempts < 6) {
      attempts += 1;
      window.setTimeout(focus, 16);
    }
  };

  window.setTimeout(focus, 0);
};

export const useEvidenceDeletion = ({
  selectedEvidence,
  canEditEvidence,
  onSuccess,
}: {
  selectedEvidence?: Evidence;
  canEditEvidence: boolean;
  onSuccess: () => void;
}) => {
  const [deleteTarget, setDeleteTarget] = useState<Evidence>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();
  const deleteInvokerRef = useRef<HTMLElement | null>(null);

  const requestDeleteEvidence = (
    target = selectedEvidence,
    invoker?: HTMLElement | null,
  ) => {
    if (!target || !canEditEvidence) {
      return;
    }

    deleteInvokerRef.current =
      invoker ??
      (document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null);

    setDeleteTarget(target);
    setDeleteError(undefined);
  };

  const cancelDeleteEvidence = () => {
    if (isDeleting) {
      return;
    }

    const invoker = deleteInvokerRef.current;

    setDeleteTarget(undefined);
    setDeleteError(undefined);
    deleteInvokerRef.current = null;

    scheduleFocus(() => invoker);
  };

  const confirmDeleteEvidence = async () => {
    if (!deleteTarget) {
      return;
    }

    const target = deleteTarget;

    setIsDeleting(true);
    setDeleteError(undefined);

    try {
      await evidenceService.remove(target.id);
      setDeleteTarget(undefined);
      deleteInvokerRef.current = null;
      onSuccess();
      focusNextEvidenceAction(target.id);
    } catch (error) {
      setDeleteError(getDeleteErrorMessage(error));
      scheduleFocus(() =>
        document.querySelector<HTMLButtonElement>('.modal-footer button'),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const resetDeletion = () => {
    setDeleteTarget(undefined);
    setDeleteError(undefined);
    setIsDeleting(false);
    deleteInvokerRef.current = null;
  };

  return {
    deleteTarget,
    isDeleting,
    deleteError,
    requestDeleteEvidence,
    cancelDeleteEvidence,
    confirmDeleteEvidence,
    resetDeletion,
  };
};

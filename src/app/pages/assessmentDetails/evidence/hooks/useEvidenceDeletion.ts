import { useState } from 'react';

import type { Evidence } from '~/domain';
import { evidenceService } from '~/services';

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

  const requestDeleteEvidence = () => {
    if (!selectedEvidence || !canEditEvidence) {
      return;
    }

    setDeleteTarget(selectedEvidence);
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
      setDeleteTarget(undefined);
      onSuccess();
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : 'Unable to delete evidence.',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const resetDeletion = () => {
    setDeleteTarget(undefined);
    setDeleteError(undefined);
    setIsDeleting(false);
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

import { useState } from 'react';

import type { AssessmentWorkspaceOverview } from '~/services/assessmentService';
import { assessmentService } from '~/services';
import { ApiError } from '~/services/apiClient';

import type { AssessmentDetailAction } from '../assessmentDetails.type';

const getActionCommand = (
  action: AssessmentDetailAction,
  companyId: string,
  assessmentId: string,
  recordVersion: number,
) => {
  switch (action) {
    case 'start':
      return assessmentService.start(companyId, assessmentId, recordVersion);
    case 'complete':
      return assessmentService.complete(companyId, assessmentId, recordVersion);
    case 'reopen':
      return assessmentService.reopen(companyId, assessmentId, recordVersion);
    case 'archive':
      return assessmentService.archive(companyId, assessmentId, recordVersion);
    default:
      return Promise.reject(new Error('Unsupported assessment action.'));
  }
};

export const useAssessmentActions = ({
  companyId,
  assessmentId,
  recordVersion,
  onSuccess,
}: {
  companyId?: string;
  assessmentId?: string;
  recordVersion?: number;
  onSuccess: (overview: AssessmentWorkspaceOverview) => void;
}) => {
  const [pendingAction, setPendingAction] = useState<
    AssessmentDetailAction | undefined
  >();
  const [actionError, setActionError] = useState<string | undefined>();
  const [conflictError, setConflictError] = useState<string | undefined>();

  const handleAction = async (action: AssessmentDetailAction) => {
    if (
      !companyId ||
      !assessmentId ||
      recordVersion === undefined ||
      pendingAction
    ) {
      return;
    }

    setPendingAction(action);
    setActionError(undefined);
    setConflictError(undefined);

    try {
      const nextOverview = await getActionCommand(
        action,
        companyId,
        assessmentId,
        recordVersion,
      );
      onSuccess(nextOverview);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setConflictError(
          error.message || 'The assessment was modified by another user.',
        );
      } else {
        setActionError(
          error instanceof Error
            ? error.message
            : 'Unable to update assessment.',
        );
      }
    } finally {
      setPendingAction(undefined);
    }
  };

  return {
    pendingAction,
    actionError,
    conflictError,
    handleAction,
  };
};

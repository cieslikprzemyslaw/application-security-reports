import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';

import {
  CWE_CATALOG_CURRENT_VERSION,
  OWASP_TOP_10_CURRENT_VERSION,
} from '~/domain';
import type {
  CweCatalogVersion,
  OwaspTop10Version,
  ThreatResponse,
  ThreatReviewCommand,
} from '~/domain';
import { threatService } from '~/services';
import { useDirtyFormGuard } from '~/app/hooks/useDirtyFormGuard';
import type { DirtyFormGuardControls } from '~/app/hooks/useDirtyFormGuard';
import { ApiError } from '~/services/apiClient';

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
import { useAssessmentFindingsCollection } from './useAssessmentFindingsCollection';

export type FindingDrawerMode = 'view' | 'create' | 'edit' | null;

const focusThreatDeleteSuccessTarget = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const requestFrame =
    window.requestAnimationFrame?.bind(window) ??
    ((callback: FrameRequestCallback) => window.setTimeout(callback, 0));

  requestFrame(() => {
    document
      .querySelector<HTMLButtonElement>(
        '[data-threat-delete-success-focus="true"]',
      )
      ?.focus();
  });
};

export interface AssessmentFindingsController {
  threats: ThreatResponse[];
  isLoading: boolean;
  isRefreshing: boolean;
  hasLoadedFindings: boolean;
  loadError?: string;
  drawerMode: FindingDrawerMode;
  selectedFinding?: ThreatResponse;
  draftValue: ThreatFormValue;
  fieldErrors: ThreatFormErrors;
  formError?: string;
  isSubmitting: boolean;
  isDeleting: boolean;
  deleteError?: string;
  pendingReviewAction?: ThreatReviewCommand;
  reviewError?: string;
  canEditFindings: boolean;
  reloadFindings: () => void;
  openCreateFinding: () => void;
  openEditFinding: (threat?: ThreatResponse | ThreatTableRow) => void;
  openFindingDetails: (threat: ThreatResponse | ThreatTableRow) => void;
  closeFindingDrawer: () => void;
  handleFindingChange: (value: ThreatFormValue) => void;
  handleFindingSave: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleFindingDelete: (
    threat?: ThreatResponse | ThreatTableRow,
  ) => Promise<void>;
  handleReviewAction: (command: ThreatReviewCommand) => Promise<void>;
  dirtyFormGuard: DirtyFormGuardControls;
}

export const useAssessmentFindings = ({
  assessmentId,
  assessmentStatus,
  assessmentOwaspTaxonomyVersion = OWASP_TOP_10_CURRENT_VERSION,
  assessmentCweCatalogVersion = CWE_CATALOG_CURRENT_VERSION,
  onMutationSuccess,
}: {
  assessmentId?: string;
  assessmentStatus?: AssessmentDetailsAssessment['status'];
  assessmentOwaspTaxonomyVersion?: OwaspTop10Version;
  assessmentCweCatalogVersion?: CweCatalogVersion;
  onMutationSuccess?: (delta: number) => void;
}): AssessmentFindingsController => {
  const collection = useAssessmentFindingsCollection(assessmentId);
  const [drawerMode, setDrawerMode] = useState<FindingDrawerMode>(null);
  const [selectedFindingId, setSelectedFindingId] = useState<string>();
  const [draftValue, setDraftValue] = useState(
    createEmptyThreatFormValue(
      assessmentOwaspTaxonomyVersion,
      assessmentCweCatalogVersion,
    ),
  );
  const [baselineValue, setBaselineValue] = useState(draftValue);
  const [fieldErrors, setFieldErrors] = useState<ThreatFormErrors>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();
  const [pendingReviewAction, setPendingReviewAction] = useState<
    ThreatReviewCommand | undefined
  >();
  const [reviewError, setReviewError] = useState<string | undefined>();

  const isDirty =
    drawerMode !== null &&
    drawerMode !== 'view' &&
    !areThreatFormValuesEqual(draftValue, baselineValue);
  const dirtyFormGuard = useDirtyFormGuard(isDirty && !isSubmitting);

  const selectedFinding = useMemo(
    () => collection.threats.find(threat => threat.id === selectedFindingId),
    [collection.threats, selectedFindingId],
  );

  const resetDrawerState = () => {
    setDrawerMode(null);
    setSelectedFindingId(undefined);
    const value = createEmptyThreatFormValue(
      assessmentOwaspTaxonomyVersion,
      assessmentCweCatalogVersion,
    );

    setDraftValue(value);
    setBaselineValue(value);
    setFieldErrors({});
    setFormError(undefined);
    setIsSubmitting(false);
    setDeleteError(undefined);
    setReviewError(undefined);
  };

  const openCreateFinding = () => {
    dirtyFormGuard.requestDiscard(() => {
      const value = createEmptyThreatFormValue(
        assessmentOwaspTaxonomyVersion,
        assessmentCweCatalogVersion,
      );

      setSelectedFindingId(undefined);
      setDrawerMode('create');
      setDraftValue(value);
      setBaselineValue(value);
      setFieldErrors({});
      setFormError(undefined);
      setDeleteError(undefined);
      setReviewError(undefined);
    });
  };

  const openFindingDetails = (threat: ThreatResponse | ThreatTableRow) => {
    const finding =
      'strideCategories' in threat
        ? threat
        : collection.threats.find(item => item.id === threat.id);

    if (!finding) {
      return;
    }

    dirtyFormGuard.requestDiscard(() => {
      const value = threatToFormValue(
        finding,
        assessmentOwaspTaxonomyVersion,
        assessmentCweCatalogVersion,
      );

      setSelectedFindingId(finding.id);
      setDrawerMode('view');
      setDraftValue(value);
      setBaselineValue(value);
      setFieldErrors({});
      setFormError(undefined);
      setDeleteError(undefined);
      setReviewError(undefined);
    });
  };

  const openEditFinding = (threat?: ThreatResponse | ThreatTableRow) => {
    const finding =
      threat && 'strideCategories' in threat
        ? threat
        : threat
          ? collection.threats.find(item => item.id === threat.id)
          : selectedFinding;

    if (!finding) {
      return;
    }

    dirtyFormGuard.requestDiscard(() => {
      const value = threatToFormValue(
        finding,
        assessmentOwaspTaxonomyVersion,
        assessmentCweCatalogVersion,
      );

      setSelectedFindingId(finding.id);
      setDrawerMode('edit');
      setDraftValue(value);
      setBaselineValue(value);
      setFieldErrors({});
      setFormError(undefined);
      setDeleteError(undefined);
      setReviewError(undefined);
    });
  };

  const closeFindingDrawer = () => {
    if (isSubmitting) {
      return;
    }

    dirtyFormGuard.requestDiscard(resetDrawerState);
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
        onMutationSuccess?.(1);
      }

      collection.reloadFindings();
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

  const handleReviewAction = async (command: ThreatReviewCommand) => {
    if (!selectedFinding || pendingReviewAction) {
      return;
    }

    const action = selectedFinding.reviewActions.find(
      candidate => candidate.command === command,
    );

    if (!action?.allowed) {
      setReviewError(
        action?.reason ?? 'This review action is not currently available.',
      );
      return;
    }

    setPendingReviewAction(command);
    setReviewError(undefined);

    try {
      const updated = await threatService.transitionReview(
        selectedFinding.id,
        command,
        selectedFinding.recordVersion,
      );
      collection.replaceFinding(updated);
      setSelectedFindingId(updated.id);
      collection.reloadFindings();
    } catch (error) {
      setReviewError(
        error instanceof Error
          ? error.message
          : 'Unable to update the Threat review state.',
      );
    } finally {
      setPendingReviewAction(undefined);
    }
  };

  const handleFindingDelete = async (
    threat?: ThreatResponse | ThreatTableRow,
  ) => {
    if (isDeleting) {
      return;
    }

    const target = threat ?? selectedFinding;
    const targetId = target?.id ?? selectedFindingId;

    if (!targetId) {
      return;
    }

    const title = target?.title ?? selectedFinding?.title ?? 'this threat';

    setDeleteError(undefined);

    if (!window.confirm(`Delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(undefined);

    try {
      await threatService.remove(targetId);
      collection.reloadFindings();
      resetDrawerState();
      onMutationSuccess?.(-1);
      focusThreatDeleteSuccessTarget();
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : 'Unable to delete threat.',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    ...collection,
    drawerMode,
    selectedFinding,
    draftValue,
    fieldErrors,
    formError,
    isSubmitting,
    isDeleting,
    deleteError,
    pendingReviewAction,
    reviewError,
    canEditFindings: assessmentStatus !== 'archived',
    openCreateFinding,
    openEditFinding,
    openFindingDetails,
    closeFindingDrawer,
    handleFindingChange,
    handleFindingSave,
    handleFindingDelete,
    handleReviewAction,
    dirtyFormGuard,
  };
};

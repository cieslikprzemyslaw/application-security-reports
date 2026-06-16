import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { assessmentService } from '~/services';
import { ApiError } from '~/services/apiClient';

import { toAssessmentViewModel } from '../assessmentDetails.mapper';
import type { AssessmentDetailsAssessment } from '../assessmentDetails.type';
import type { AssessmentWorkspaceOverview } from '~/services/assessmentService';

export interface UseAssessmentOverviewResult {
  overview?: AssessmentWorkspaceOverview;
  assessmentView?: AssessmentDetailsAssessment;
  isLoading: boolean;
  loadError?: string;
  isNotFound: boolean;
  setOverview: Dispatch<
    SetStateAction<AssessmentWorkspaceOverview | undefined>
  >;
}

export const useAssessmentOverview = ({
  companyId,
  assessmentId,
}: {
  companyId?: string;
  assessmentId?: string;
}): UseAssessmentOverviewResult => {
  const [overview, setOverview] = useState<AssessmentWorkspaceOverview>();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | undefined>();
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadOverview = async () => {
      if (!companyId || !assessmentId) {
        if (isActive) {
          setIsNotFound(true);
          setIsLoading(false);
        }

        return;
      }

      setIsLoading(true);
      setLoadError(undefined);
      setIsNotFound(false);

      try {
        const nextOverview = await assessmentService.getOverview(
          companyId,
          assessmentId,
          controller.signal,
        );

        if (isActive) {
          setOverview(nextOverview);
        }
      } catch (error) {
        if (
          !isActive ||
          (error instanceof DOMException && error.name === 'AbortError')
        ) {
          return;
        }

        if (error instanceof ApiError && error.status === 404) {
          setIsNotFound(true);
          setOverview(undefined);
          return;
        }

        setOverview(undefined);
        setLoadError(
          error instanceof Error
            ? error.message
            : 'Unable to load assessment overview.',
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadOverview();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [assessmentId, companyId]);

  return {
    overview,
    assessmentView: overview ? toAssessmentViewModel(overview) : undefined,
    isLoading,
    loadError,
    isNotFound,
    setOverview,
  };
};

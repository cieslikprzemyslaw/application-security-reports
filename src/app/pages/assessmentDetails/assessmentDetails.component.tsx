import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  EntityNotFoundView,
  RouteLoadingView,
} from '~/app/components/routeStateViews';
import { assessmentService } from '~/services';
import { ApiError } from '~/services/apiClient';
import { routes } from '~/routes';

import AssessmentDetailsView from './assessmentDetails.view';

import type {
  AssessmentDetailAction,
  AssessmentDetailSection,
  AssessmentDetailsAssessment,
} from './assessmentDetails.type';

import type { AssessmentWorkspaceOverview } from '~/services/assessmentService';

interface AssessmentDetailsRouteProps {
  activeSection: AssessmentDetailSection;
}

const sectionHrefMap: Record<
  AssessmentDetailSection,
  (companyId: string, assessmentId: string) => string
> = {
  overview: routes.assessmentDetailsOverview,
  findings: routes.assessmentDetailsFindings,
  evidence: routes.assessmentDetailsEvidence,
  reports: routes.assessmentDetailsReports,
  history: routes.assessmentDetailsHistory,
};

const toAssessmentViewModel = (
  overview: AssessmentWorkspaceOverview,
): AssessmentDetailsAssessment => ({
  ...overview.assessment,
  companyName: overview.company.name,
  applicationName:
    overview.assessment.applicationName?.trim() ||
    overview.assessment.title?.trim() ||
    'Untitled assessment',
});

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

const AssessmentDetails = ({ activeSection }: AssessmentDetailsRouteProps) => {
  const navigate = useNavigate();
  const { companyId, assessmentId } = useParams<{
    companyId?: string;
    assessmentId?: string;
  }>();
  const [overview, setOverview] = useState<
    AssessmentWorkspaceOverview | undefined
  >();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | undefined>();
  const [isNotFound, setIsNotFound] = useState(false);
  const [pendingAction, setPendingAction] = useState<AssessmentDetailAction>();
  const [actionError, setActionError] = useState<string | undefined>();
  const [conflictError, setConflictError] = useState<string | undefined>();

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
      setActionError(undefined);
      setConflictError(undefined);

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

  const assessmentView = useMemo(
    () => (overview ? toAssessmentViewModel(overview) : undefined),
    [overview],
  );

  const handleSectionChange = (section: AssessmentDetailSection) => {
    if (!companyId || !assessmentId) {
      return;
    }

    navigate(sectionHrefMap[section](companyId, assessmentId));
  };

  const handleAction = async (action: AssessmentDetailAction) => {
    if (!companyId || !assessmentId || !overview) {
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
        overview.assessment.recordVersion,
      );

      setOverview(nextOverview);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setConflictError(
          error.message || 'The assessment was modified by another session.',
        );
        return;
      }

      setActionError(
        error instanceof Error
          ? error.message
          : 'Unable to update the assessment.',
      );
    } finally {
      setPendingAction(undefined);
    }
  };

  if (isLoading) {
    return <RouteLoadingView />;
  }

  if (isNotFound || !companyId || !assessmentId) {
    const returnHref = companyId
      ? routes.companyWorkspaceAssessments(companyId)
      : routes.assessments;

    return (
      <EntityNotFoundView
        entityName="Assessment"
        listHref={returnHref}
        listLabel="Return to assessments"
      />
    );
  }

  if (loadError) {
    return (
      <div role="alert">
        <h1>Assessment workspace</h1>

        <p>{loadError}</p>
      </div>
    );
  }

  if (!assessmentView) {
    return <RouteLoadingView />;
  }

  return (
    <AssessmentDetailsView
      assessment={assessmentView}
      activeSection={activeSection}
      overviewHref={routes.assessmentDetailsOverview(companyId, assessmentId)}
      onSectionChange={handleSectionChange}
      onBack={() => navigate(routes.companyWorkspaceAssessments(companyId))}
      onAction={handleAction}
      isActionLoading={pendingAction !== undefined}
      pendingAction={pendingAction}
      actionError={actionError}
      conflictError={conflictError}
    />
  );
};

export default AssessmentDetails;

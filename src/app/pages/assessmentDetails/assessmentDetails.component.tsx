import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import {
  EntityNotFoundView,
  RouteLoadingView,
} from '~/app/components/routeStateViews';
import { routes } from '~/routes';

import AssessmentDetailsView from './assessmentDetails.view';
import DeleteAssessmentModal from './DeleteAssessmentModal';
import { useAssessmentOverview } from './hooks/useAssessmentOverview';
import { useAssessmentActions } from './hooks/useAssessmentActions';
import { usePermanentAssessmentDeletion } from './hooks/usePermanentAssessmentDeletion';
import { useAssessmentFindings } from './hooks/useAssessmentFindings';
import { useAssessmentEvidence } from './evidence/hooks/useAssessmentEvidence';
import AssessmentFindingsSection, {
  type AssessmentFindingsInitialEditTarget,
} from './components/assessmentFindingsSection.component';
import AssessmentEvidenceSection from './evidence/section/EvidenceSection';
import AssessmentReportsSection from './reports/assessmentReportsSection.component';

import type { AssessmentDetailSection } from './assessmentDetails.type';
import type { ReportReadinessTarget } from '~/domain';

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

const threatReadinessFieldMap: Record<
  string,
  AssessmentFindingsInitialEditTarget['focusField']
> = {
  description: 'observation',
  impact: 'risk',
  recommendation: 'recommendation',
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const parseInitialThreatEditTarget = (
  state: unknown,
): AssessmentFindingsInitialEditTarget | undefined => {
  if (!isRecord(state) || !isRecord(state.reportReadinessTarget)) {
    return undefined;
  }

  const target = state.reportReadinessTarget as Partial<ReportReadinessTarget>;

  if (
    target.resourceType !== 'threat' ||
    typeof target.resourceId !== 'string' ||
    typeof target.field !== 'string'
  ) {
    return undefined;
  }

  const focusField = threatReadinessFieldMap[target.field];

  return focusField
    ? {
        threatId: target.resourceId,
        focusField,
      }
    : undefined;
};

const AssessmentDetails = ({ activeSection }: AssessmentDetailsRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { companyId, assessmentId } = useParams<{
    companyId?: string;
    assessmentId?: string;
  }>();
  const initialThreatEditTarget = useMemo(
    () => parseInitialThreatEditTarget(location.state),
    [location.state],
  );

  const {
    overview,
    assessmentView,
    isLoading,
    loadError,
    isNotFound,
    setOverview,
  } = useAssessmentOverview({ companyId, assessmentId });

  const handleFindingsCountChange = (delta: number) => {
    setOverview(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        assessment: {
          ...prev.assessment,
          findingsCount: Math.max(0, prev.assessment.findingsCount + delta),
        },
      };
    });
  };

  const { pendingAction, actionError, conflictError, handleAction } =
    useAssessmentActions({
      companyId,
      assessmentId,
      recordVersion: overview?.assessment.recordVersion,
      onSuccess: nextOverview => setOverview(nextOverview),
    });

  const findingsController = useAssessmentFindings({
    assessmentId,
    assessmentStatus: assessmentView?.status,
    assessmentOwaspTaxonomyVersion: assessmentView?.owaspTaxonomyVersion,
    onMutationSuccess: handleFindingsCountChange,
  });

  const handleEvidenceCountChange = (delta: number) => {
    setOverview(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        assessment: {
          ...prev.assessment,
          evidenceCount: Math.max(0, prev.assessment.evidenceCount + delta),
        },
      };
    });
  };

  const evidenceController = useAssessmentEvidence({
    assessmentId,
    assessmentStatus: assessmentView?.status,
    onMutationSuccess: handleEvidenceCountChange,
  });

  const handleReportVersionCountChange = (delta: number) => {
    setOverview(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        assessment: {
          ...prev.assessment,
          reportVersionCount: Math.max(
            0,
            prev.assessment.reportVersionCount + delta,
          ),
        },
      };
    });
  };

  const permanentDeletionController = usePermanentAssessmentDeletion({
    onDeleted: ({ cleanupWarnings }) => {
      if (!companyId) {
        return;
      }

      navigate(routes.companyWorkspaceAssessments(companyId), {
        replace: true,
        state:
          cleanupWarnings.length > 0
            ? { assessmentCleanupWarnings: cleanupWarnings }
            : undefined,
      });
    },
  });

  const handleSectionChange = (section: AssessmentDetailSection) => {
    if (!companyId || !assessmentId) {
      return;
    }

    navigate(sectionHrefMap[section](companyId, assessmentId));
  };

  const handleInitialThreatEditTargetHandled = useCallback(() => {
    void navigate(location.pathname, {
      replace: true,
      state: null,
    });
  }, [location.pathname, navigate]);

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
    <>
      <AssessmentDetailsView
        assessment={assessmentView}
        activeSection={activeSection}
        overviewHref={routes.assessmentDetailsOverview(companyId, assessmentId)}
        findingsContent={
          <AssessmentFindingsSection
            assessment={assessmentView}
            initialEditTarget={initialThreatEditTarget}
            onInitialEditTargetHandled={handleInitialThreatEditTargetHandled}
            {...findingsController}
          />
        }
        evidenceContent={
          <AssessmentEvidenceSection
            assessment={assessmentView}
            threats={findingsController.threats}
            controller={evidenceController}
          />
        }
        reportsContent={
          <AssessmentReportsSection
            companyId={companyId}
            assessmentId={assessmentId}
            onVersionCountChange={handleReportVersionCountChange}
          />
        }
        onSectionChange={handleSectionChange}
        onBack={() => navigate(routes.companyWorkspaceAssessments(companyId))}
        onAction={action => {
          void handleAction(action);
        }}
        isActionLoading={pendingAction !== undefined}
        pendingAction={pendingAction}
        actionError={actionError}
        conflictError={conflictError}
        onPermanentDeleteRequest={event => {
          permanentDeletionController.requestPermanentDelete(
            assessmentView,
            event.currentTarget,
          );
        }}
      />

      <DeleteAssessmentModal controller={permanentDeletionController} />
    </>
  );
};

export default AssessmentDetails;

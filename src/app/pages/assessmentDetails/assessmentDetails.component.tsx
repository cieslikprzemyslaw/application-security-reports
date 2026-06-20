import { useNavigate, useParams } from 'react-router-dom';

import {
  EntityNotFoundView,
  RouteLoadingView,
} from '~/app/components/routeStateViews';
import { routes } from '~/routes';

import AssessmentDetailsView from './assessmentDetails.view';
import { useAssessmentOverview } from './hooks/useAssessmentOverview';
import { useAssessmentActions } from './hooks/useAssessmentActions';
import { useAssessmentFindings } from './hooks/useAssessmentFindings';
import { useAssessmentEvidence } from './evidence/hooks/useAssessmentEvidence';
import AssessmentFindingsSection from './components/assessmentFindingsSection.component';
import AssessmentEvidenceSection from './evidence/section/EvidenceSection';

import type { AssessmentDetailSection } from './assessmentDetails.type';

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

const AssessmentDetails = ({ activeSection }: AssessmentDetailsRouteProps) => {
  const navigate = useNavigate();
  const { companyId, assessmentId } = useParams<{
    companyId?: string;
    assessmentId?: string;
  }>();

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

  const handleSectionChange = (section: AssessmentDetailSection) => {
    if (!companyId || !assessmentId) {
      return;
    }

    navigate(sectionHrefMap[section](companyId, assessmentId));
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
      findingsContent={
        <AssessmentFindingsSection
          assessment={assessmentView}
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
      onSectionChange={handleSectionChange}
      onBack={() => navigate(routes.companyWorkspaceAssessments(companyId))}
      onAction={action => {
        void handleAction(action);
      }}
      isActionLoading={pendingAction !== undefined}
      pendingAction={pendingAction}
      actionError={actionError}
      conflictError={conflictError}
    />
  );
};

export default AssessmentDetails;

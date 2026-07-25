import React from 'react';
import ActivityHistory from '~/app/components/appsec/activityHistory';
import AssessmentSummary from '~/app/components/appsec/assessmentSummary';
import Callout from '~/app/components/ui/callout';
import Card from '~/app/components/ui/card';
import IconSVG from '~/app/components/ui/iconSVG';
import StatCard from '~/app/components/common/statCard';
import { PageHeader } from '~/app/components/common';
import Tabs from '~/app/components/ui/tabs';
import {
  formatDateRange,
  formatWithMissingValue,
} from '~/app/utils/formatters';

import StyledAssessmentDetails from './assessmentDetails.styled';

import type {
  AssessmentDetailAction,
  AssessmentDetailSection,
  AssessmentDetailsAssessment,
  AssessmentDetailsViewProps,
} from './assessmentDetails.type';

const sectionLabelMap: Record<AssessmentDetailSection, string> = {
  overview: 'Overview',
  findings: 'Findings',
  evidence: 'Evidence',
  reports: 'Reports',
  history: 'History',
};

const sectionPlaceholderCopy: Record<
  Exclude<AssessmentDetailSection, 'overview' | 'history'>,
  string
> = {
  findings: 'Finding details will be added in a later issue.',
  evidence: 'Evidence management will be added in a later issue.',
  reports: 'Assessment report details will be added in a later issue.',
};

const actionLabelMap: Record<AssessmentDetailAction, string> = {
  start: 'Start',
  complete: 'Complete',
  reopen: 'Reopen',
  archive: 'Archive',
  restore: 'Restore',
};

const defaultActionOrder: AssessmentDetailAction[] = [
  'start',
  'complete',
  'reopen',
  'archive',
  'restore',
];

const getAssessmentName = (assessment: AssessmentDetailsAssessment) =>
  formatWithMissingValue(assessment.applicationName);

const getAvailableActions = (
  assessment: AssessmentDetailsAssessment,
): AssessmentDetailAction[] =>
  assessment.availableActions && assessment.availableActions.length > 0
    ? assessment.availableActions
    : assessment.status === 'draft'
      ? ['archive']
      : assessment.status === 'in-progress'
        ? ['complete', 'archive']
        : assessment.status === 'completed'
          ? ['reopen', 'archive']
          : ['restore'];

const AssessmentDetailsView = ({
  assessment,
  activeSection,
  companiesHref,
  companyHref,
  assessmentsHref,
  overviewHref,
  findingsContent,
  evidenceContent,
  reportsContent,
  onSectionChange,
  onBack,
  onAction,
  isActionLoading = false,
  pendingAction,
  actionError,
  conflictError,
  onPermanentDeleteRequest,
}: AssessmentDetailsViewProps) => {
  const assessmentName = getAssessmentName(assessment);
  const actions = getAvailableActions(assessment).filter(action =>
    defaultActionOrder.includes(action),
  );
  const primaryAssessmentAction = actions.find(action => action !== 'archive');
  const archiveActions = actions.filter(action => action === 'archive');
  const canPermanentlyDelete =
    assessment.status === 'archived' && Boolean(onPermanentDeleteRequest);
  const summaryMetadata = [
    {
      label: 'Assessment type',
      value: formatWithMissingValue(assessment.assessmentType),
      icon: <IconSVG name="assessment" />,
    },
    {
      label: 'Description',
      value: formatWithMissingValue(assessment.description),
      icon: <IconSVG name="file" />,
    },
    {
      label: 'Scope',
      value: formatWithMissingValue(assessment.scope),
      icon: <IconSVG name="finding" />,
    },
  ];

  const renderOverviewPanel = () => (
    <Card
      title="Workspace counts"
      subtitle="Live totals from the assessment overview."
      padding="large"
    >
      <div className="assessment-details-count-grid">
        <StatCard
          label="Findings"
          value={assessment.findingsCount}
          icon={<IconSVG name="finding" />}
          helperText="Confirmed security findings"
        />

        <StatCard
          label="Evidence"
          value={assessment.evidenceCount}
          icon={<IconSVG name="evidence" />}
          helperText="Linked evidence items"
        />

        <StatCard
          label="Report versions"
          value={assessment.reportVersionCount}
          icon={<IconSVG name="report" />}
          helperText="Generated report snapshots"
        />
      </div>
    </Card>
  );

  const renderPlaceholderPanel = (
    section: Exclude<AssessmentDetailSection, 'overview' | 'history'>,
  ) => (
    <Card title={sectionLabelMap[section]} padding="large">
      <p className="assessment-details-placeholder-copy">
        {sectionPlaceholderCopy[section]}
      </p>
    </Card>
  );

  return (
    <StyledAssessmentDetails>
      <PageHeader
        eyebrow="Assessment workspace"
        title={assessmentName}
        context={[
          { label: 'Companies', href: companiesHref },
          { label: assessment.companyName, href: companyHref },
          { label: 'Assessments', href: assessmentsHref },
          { label: assessmentName, href: overviewHref },
          { label: sectionLabelMap[activeSection] },
        ]}
        documentTitle={`${sectionLabelMap[activeSection]} - ${assessmentName}`}
        subtitle={assessment.companyName}
        primaryAction={
          primaryAssessmentAction
            ? {
                id: `assessment-${primaryAssessmentAction}`,
                label: actionLabelMap[primaryAssessmentAction],
                isLoading: pendingAction === primaryAssessmentAction,
                disabled:
                  isActionLoading && pendingAction !== primaryAssessmentAction,
                onActivate: () => onAction(primaryAssessmentAction),
              }
            : undefined
        }
        secondaryActions={
          onBack
            ? [
                {
                  id: 'back-to-assessments',
                  label: 'Back to assessments',
                  onActivate: onBack,
                },
              ]
            : undefined
        }
        overflowActions={archiveActions.map(action => ({
          id: `assessment-${action}`,
          label: actionLabelMap[action],
          isLoading: pendingAction === action,
          disabled: isActionLoading && pendingAction !== action,
          onActivate: () => onAction(action),
        }))}
        destructiveAction={
          canPermanentlyDelete
            ? {
                id: 'permanent-delete-assessment',
                label: 'Permanent delete',
                disabled: isActionLoading,
                onActivate: () => onPermanentDeleteRequest?.(),
              }
            : undefined
        }
      />

      {assessment.status === 'archived' && (
        <Callout variant="info" title="Archived Assessment">
          <p>
            This workspace is read-only. Restore the Assessment to make changes.
          </p>
        </Callout>
      )}

      <AssessmentSummary
        companyName={assessment.companyName}
        applicationName={assessmentName}
        assessmentId={assessment.id}
        environment={formatWithMissingValue(assessment.environment)}
        dateRange={formatDateRange(
          assessment.startedAt,
          assessment.completedAt,
        )}
        testerName={formatWithMissingValue(assessment.testerName)}
        overallRisk={assessment.overallRisk ?? 'informational'}
        status={assessment.status}
        metadata={summaryMetadata}
      />

      {(actionError || conflictError) && (
        <div className="assessment-details-feedback">
          {conflictError ? (
            <Callout variant="warning" title="Assessment changed elsewhere">
              <p>{conflictError}</p>
            </Callout>
          ) : null}

          {actionError ? (
            <Callout variant="error" title="Unable to update assessment">
              <p>{actionError}</p>
            </Callout>
          ) : null}
        </div>
      )}

      <Tabs
        ariaLabel="Assessment sections"
        activeTabId={activeSection}
        onChange={onSectionChange}
        items={[
          {
            id: 'overview',
            label: 'Overview',
            content: renderOverviewPanel(),
          },
          {
            id: 'findings',
            label: 'Findings',
            count: assessment.findingsCount,
            content: findingsContent ?? renderPlaceholderPanel('findings'),
          },
          {
            id: 'evidence',
            label: 'Evidence',
            count: assessment.evidenceCount,
            content: evidenceContent ?? renderPlaceholderPanel('evidence'),
          },
          {
            id: 'reports',
            label: 'Reports',
            count: assessment.reportVersionCount,
            content: reportsContent ?? renderPlaceholderPanel('reports'),
          },
          {
            id: 'history',
            label: 'History',
            content: (
              <ActivityHistory
                scope={{
                  type: 'assessment',
                  companyId: assessment.companyId,
                  assessmentId: assessment.id,
                }}
                emptyMessage="No Assessment activity has been recorded yet."
              />
            ),
          },
        ]}
      />
    </StyledAssessmentDetails>
  );
};

export default AssessmentDetailsView;

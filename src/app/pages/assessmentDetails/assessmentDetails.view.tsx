import React from 'react';
import { Link } from 'react-router-dom';

import AssessmentSummary from '~/app/components/appsec/assessmentSummary';
import Button from '~/app/components/ui/button';
import Callout from '~/app/components/ui/callout';
import Card from '~/app/components/ui/card';
import IconSVG from '~/app/components/ui/iconSVG';
import StatCard from '~/app/components/common/statCard';
import Tabs from '~/app/components/ui/tabs';
import { formatDate, formatWithMissingValue } from '~/app/utils/formatters';

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
  Exclude<AssessmentDetailSection, 'overview'>,
  string
> = {
  findings: 'Finding details will be added in a later issue.',
  evidence: 'Evidence management will be added in a later issue.',
  reports: 'Assessment report details will be added in a later issue.',
  history: 'Version history details will be added in a later issue.',
};

const actionLabelMap: Record<AssessmentDetailAction, string> = {
  start: 'Start',
  complete: 'Complete',
  reopen: 'Reopen',
  archive: 'Archive',
};

const defaultActionOrder: AssessmentDetailAction[] = [
  'start',
  'complete',
  'reopen',
  'archive',
];

const getAssessmentName = (assessment: AssessmentDetailsAssessment) =>
  formatWithMissingValue(assessment.applicationName);

const formatDateRange = (startedAt?: string, completedAt?: string) => {
  const start = formatDate(startedAt);
  const end = formatDate(completedAt);

  if (start === '—' && end === '—') {
    return '—';
  }

  if (start === '—') {
    return end;
  }

  if (end === '—') {
    return start;
  }

  return `${start} to ${end}`;
};

const getAvailableActions = (
  assessment: AssessmentDetailsAssessment,
): AssessmentDetailAction[] =>
  assessment.availableActions && assessment.availableActions.length > 0
    ? assessment.availableActions
    : assessment.status === 'draft'
      ? ['start', 'archive']
      : assessment.status === 'in-progress'
        ? ['complete', 'archive']
        : assessment.status === 'completed'
          ? ['reopen', 'archive']
          : ['reopen'];

const AssessmentDetailsView = ({
  assessment,
  activeSection,
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
}: AssessmentDetailsViewProps) => {
  const assessmentName = getAssessmentName(assessment);
  const assessmentNameLink =
    activeSection === 'overview' ? undefined : overviewHref;
  const actions = getAvailableActions(assessment).filter(action =>
    defaultActionOrder.includes(action),
  );
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
    section: Exclude<AssessmentDetailSection, 'overview'>,
  ) => (
    <Card title={sectionLabelMap[section]} padding="large">
      <p className="assessment-details-placeholder-copy">
        {sectionPlaceholderCopy[section]}
      </p>
    </Card>
  );

  return (
    <StyledAssessmentDetails>
      <header className="assessment-details-header">
        <div className="assessment-details-header-copy">
          {onBack && (
            <div className="assessment-details-mobile-back">
              <Button
                title="Back to assessments"
                variant="secondary"
                size="small"
                onClick={onBack}
              />
            </div>
          )}

          <nav aria-label="Breadcrumb">
            <ol className="assessment-details-breadcrumb-list">
              <li className="assessment-details-breadcrumb-item">
                <span>{assessment.companyName}</span>
              </li>

              <li className="assessment-details-breadcrumb-item">
                <Link to={overviewHref}>{assessmentName}</Link>
              </li>

              <li className="assessment-details-breadcrumb-item">
                <span aria-current="page">
                  {sectionLabelMap[activeSection]}
                </span>
              </li>
            </ol>
          </nav>

          <h1 className="assessment-details-title">
            {assessmentNameLink ? (
              <Link
                className="assessment-details-title-link"
                to={assessmentNameLink}
              >
                {assessmentName}
              </Link>
            ) : (
              <span>{assessmentName}</span>
            )}
          </h1>

          <p className="assessment-details-subtitle">
            {assessment.companyName}
          </p>

          {assessment.status === 'archived' && (
            <p className="assessment-details-read-only-note">
              Archived assessments are read-only.
            </p>
          )}
        </div>

        <div className="assessment-details-header-actions">
          {onBack && (
            <Button
              className="assessment-details-desktop-back"
              title="Back to assessments"
              variant="secondary"
              size="small"
              onClick={onBack}
            />
          )}

          {actions.map(action => (
            <Button
              key={action}
              title={actionLabelMap[action]}
              isLoading={pendingAction === action}
              disabled={isActionLoading && pendingAction !== action}
              variant={action === 'archive' ? 'secondary' : 'primary'}
              onClick={() => onAction(action)}
            />
          ))}
        </div>
      </header>

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
            content: renderPlaceholderPanel('history'),
          },
        ]}
      />
    </StyledAssessmentDetails>
  );
};

export default AssessmentDetailsView;

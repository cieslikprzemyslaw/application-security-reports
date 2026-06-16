import React from 'react';
import { Link } from 'react-router-dom';

import GlobalThreatTable from '~/app/components/appsec/globalThreatTable';
import Badge from '~/app/components/ui/badge';
import Button from '~/app/components/ui/button';
import SeverityBadge from '~/app/components/ui/severityBadge';
import Tabs from '~/app/components/ui/tabs';
import { routes } from '~/routes';

import StyledAssessmentDetails from './assessmentDetails.styled';

import type { AssessmentDetailsProps } from './assessmentDetails.type';

const assessmentStatusLabelMap: Record<string, string> = {
  draft: 'Draft',
  'in-progress': 'In Progress',
  'in-review': 'In Review',
  completed: 'Completed',
  archived: 'Archived',
};

const sectionLabelMap: Record<AssessmentDetailsProps['activeSection'], string> =
  {
    overview: 'Overview',
    findings: 'Findings',
    evidence: 'Evidence',
    reports: 'Reports',
    history: 'History',
  };

const sectionPlaceholderCopy: Record<
  Exclude<AssessmentDetailsProps['activeSection'], 'overview' | 'findings'>,
  string
> = {
  evidence: 'Evidence management will be added in a later issue.',
  reports: 'Assessment report details will be added in a later issue.',
  history: 'Version history details will be added in a later issue.',
};

const AssessmentDetails = ({
  assessment,
  threats,
  executiveSummary,
  activeSection,
  overviewHref,
  onSectionChange,
  onBack,
  onEdit,
  onAddThreat,
  onThreatClick,
}: AssessmentDetailsProps) => {
  const isArchived = assessment.status === 'archived';
  const assessmentNameLink =
    activeSection === 'overview' ? undefined : overviewHref;

  const renderAssessmentName = (className: string) =>
    assessmentNameLink ? (
      <Link className={className} to={assessmentNameLink}>
        {assessment.applicationName}
      </Link>
    ) : (
      <span className={className}>{assessment.applicationName}</span>
    );

  const renderSummaryGrid = () => (
    <div className="assessment-details-summary-grid">
      <div className="assessment-details-summary-card">
        <strong>Environment</strong>

        <p>{assessment.environment}</p>
      </div>

      <div className="assessment-details-summary-card">
        <strong>Type</strong>

        <p>{assessment.assessmentType}</p>
      </div>

      <div className="assessment-details-summary-card">
        <strong>Overall risk</strong>

        <SeverityBadge severity={assessment.overallRisk} size="small" />
      </div>

      <div className="assessment-details-summary-card">
        <strong>Status</strong>

        <Badge
          label={assessmentStatusLabelMap[assessment.status]}
          variant="neutral"
          size="small"
        />
      </div>
    </div>
  );

  const renderOverviewPanel = () => (
    <>
      <section className="assessment-details-section">
        <header className="assessment-details-section-header">
          <h2>Overview</h2>
        </header>

        <div className="assessment-details-section-body">
          {renderSummaryGrid()}
        </div>
      </section>

      <section className="assessment-details-section">
        <header className="assessment-details-section-header">
          <h2>Executive Summary</h2>
        </header>

        <div className="assessment-details-section-body">
          <p>{executiveSummary}</p>
        </div>
      </section>
    </>
  );

  const renderFindingsPanel = () => (
    <section className="assessment-details-section">
      <header className="assessment-details-section-header">
        <div>
          <h2>Findings</h2>

          <p>{threats.length} confirmed findings</p>
        </div>

        {onAddThreat && !isArchived && (
          <Button title="Add finding" onClick={onAddThreat} />
        )}
      </header>

      <GlobalThreatTable threats={threats} onThreatClick={onThreatClick} />
    </section>
  );

  const renderPlaceholderPanel = (
    section: Exclude<
      AssessmentDetailsProps['activeSection'],
      'overview' | 'findings'
    >,
  ) => (
    <section className="assessment-details-section">
      <header className="assessment-details-section-header">
        <h2>{sectionLabelMap[section]}</h2>
      </header>

      <div className="assessment-details-section-body">
        <p className="assessment-details-placeholder-copy">
          {sectionPlaceholderCopy[section]}
        </p>
      </div>
    </section>
  );

  return (
    <StyledAssessmentDetails>
      <header className="assessment-details-header">
        <div className="assessment-details-header-copy">
          <nav aria-label="Breadcrumb">
            <ol className="assessment-details-breadcrumb-list">
              <li className="assessment-details-breadcrumb-item">
                <Link to={routes.assessments}>Assessments</Link>
              </li>

              <li className="assessment-details-breadcrumb-item">
                {assessmentNameLink ? (
                  <Link to={assessmentNameLink}>
                    {assessment.applicationName}
                  </Link>
                ) : (
                  <span>{assessment.applicationName}</span>
                )}
              </li>

              <li className="assessment-details-breadcrumb-item">
                <span>{sectionLabelMap[activeSection]}</span>
              </li>
            </ol>
          </nav>

          <h1 className="assessment-details-title">
            {renderAssessmentName('assessment-details-title-link')}
          </h1>

          <p className="assessment-details-subtitle">
            {assessment.companyName}
            {' · '}
            {assessment.code}
          </p>

          {isArchived && (
            <p className="assessment-details-read-only-note">
              Archived assessments are read-only.
            </p>
          )}
        </div>

        <div className="assessment-details-header-actions">
          {onBack && (
            <Button title="Back" variant="secondary" onClick={onBack} />
          )}

          {onEdit && !isArchived && (
            <Button title="Edit assessment" onClick={onEdit} />
          )}
        </div>
      </header>

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
            count: threats.length,
            content: renderFindingsPanel(),
          },
          {
            id: 'evidence',
            label: 'Evidence',
            content: renderPlaceholderPanel('evidence'),
          },
          {
            id: 'reports',
            label: 'Reports',
            content: renderPlaceholderPanel('reports'),
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

export default AssessmentDetails;

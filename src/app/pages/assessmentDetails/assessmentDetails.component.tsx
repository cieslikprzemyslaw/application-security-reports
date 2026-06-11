import React from 'react';

import GlobalThreatTable from '~/app/components/appsec/globalThreatTable';
import Button from '~/app/components/ui/button';
import Badge from '~/app/components/ui/badge';
import SeverityBadge from '~/app/components/ui/severityBadge';

import StyledAssessmentDetails from './assessmentDetails.styled';

import type { AssessmentDetailsProps } from './assessmentDetails.type';

const assessmentStatusLabelMap: Record<string, string> = {
  draft: 'Draft',
  'in-progress': 'In Progress',
  'in-review': 'In Review',
  completed: 'Completed',
  archived: 'Archived',
};

const AssessmentDetails = ({
  assessment,
  threats,
  executiveSummary,
  onBack,
  onEdit,
  onAddThreat,
  onThreatClick,
}: AssessmentDetailsProps) => (
  <StyledAssessmentDetails>
    <header className="assessment-details-header">
      <div>
        <h1 className="assessment-details-title">
          {assessment.applicationName}
        </h1>

        <p className="assessment-details-subtitle">
          {assessment.companyName}
          {' · '}
          {assessment.code}
        </p>
      </div>

      <div className="assessment-details-header-actions">
        {onBack && <Button title="Back" variant="secondary" onClick={onBack} />}

        {onEdit && <Button title="Edit assessment" onClick={onEdit} />}
      </div>
    </header>

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

    <section className="assessment-details-section">
      <header className="assessment-details-section-header">
        <h2>Executive Summary</h2>
      </header>

      <div className="assessment-details-section-body">
        <p>{executiveSummary}</p>
      </div>
    </section>

    <section className="assessment-details-section">
      <header className="assessment-details-section-header">
        <div>
          <h2>Findings</h2>

          <p>{threats.length} confirmed findings</p>
        </div>

        {onAddThreat && <Button title="Add Threat" onClick={onAddThreat} />}
      </header>

      <GlobalThreatTable threats={threats} onThreatClick={onThreatClick} />
    </section>
  </StyledAssessmentDetails>
);

export default AssessmentDetails;

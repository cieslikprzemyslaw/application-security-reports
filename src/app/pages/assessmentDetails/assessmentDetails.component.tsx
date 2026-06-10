import React from 'react';

import GlobalThreatTable from '~/app/components/appsec/globalThreatTable';
import { AssessmentStatusBadge } from '~/app/components/appsec/assessmentTable/assessmentTable.styled';
import Button from '~/app/components/ui/button';
import SeverityBadge from '~/app/components/ui/severityBadge';

import StyledAssessmentDetails, {
  Header,
  HeaderActions,
  Section,
  SectionBody,
  SectionHeader,
  Subtitle,
  SummaryCard,
  SummaryGrid,
  Title,
} from './assessmentDetails.styled';

import type { AssessmentDetailsProps } from './assessmentDetails.type';

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
    <Header>
      <div>
        <Title>{assessment.applicationName}</Title>

        <Subtitle>
          {assessment.companyName}
          {' · '}
          {assessment.code}
        </Subtitle>
      </div>

      <HeaderActions>
        {onBack && <Button title="Back" variant="secondary" onClick={onBack} />}

        {onEdit && <Button title="Edit assessment" onClick={onEdit} />}
      </HeaderActions>
    </Header>

    <SummaryGrid>
      <SummaryCard>
        <strong>Environment</strong>

        <p>{assessment.environment}</p>
      </SummaryCard>

      <SummaryCard>
        <strong>Type</strong>

        <p>{assessment.assessmentType}</p>
      </SummaryCard>

      <SummaryCard>
        <strong>Overall risk</strong>

        <SeverityBadge severity={assessment.overallRisk} size="small" />
      </SummaryCard>

      <SummaryCard>
        <strong>Status</strong>

        <AssessmentStatusBadge $status={assessment.status}>
          {assessment.status}
        </AssessmentStatusBadge>
      </SummaryCard>
    </SummaryGrid>

    <Section>
      <SectionHeader>
        <h2>Executive Summary</h2>
      </SectionHeader>

      <SectionBody>
        <p>{executiveSummary}</p>
      </SectionBody>
    </Section>

    <Section>
      <SectionHeader>
        <div>
          <h2>Findings</h2>

          <p>{threats.length} confirmed findings</p>
        </div>

        {onAddThreat && <Button title="Add Threat" onClick={onAddThreat} />}
      </SectionHeader>

      <GlobalThreatTable threats={threats} onThreatClick={onThreatClick} />
    </Section>
  </StyledAssessmentDetails>
);

export default AssessmentDetails;

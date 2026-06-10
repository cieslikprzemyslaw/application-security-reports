import React from 'react';

import SeverityBadge from '~/app/components/ui/severityBadge';
import StatusBadge from '~/app/components/ui/statusBadge';

import StyledAssessmentSummary, {
  ApplicationName,
  AssessmentBadges,
  AssessmentIdentity,
  AssessmentMetadataGrid,
  AssessmentMetadataItemStyled,
  AssessmentMetadataLabel,
  AssessmentMetadataValue,
  AssessmentSummaryHeader,
  AssessmentTitleGroup,
  CompanyLogo,
  CompanyName,
} from './assessmentSummary.styled';

import type {
  AssessmentMetadataItem as AssessmentMetadataItemType,
  AssessmentSummaryProps,
} from './assessmentSummary.type';

const AssessmentSummary = ({
  companyName,
  companyLogo,
  applicationName,
  assessmentId,
  environment,
  dateRange,
  testerName,
  overallRisk,
  status,
  metadata = [],
  ...rest
}: AssessmentSummaryProps) => {
  const defaultMetadata: AssessmentMetadataItemType[] = [
    {
      label: 'Environment',
      value: environment,
    },
    {
      label: 'Date range',
      value: dateRange,
    },
    {
      label: 'Tester',
      value: testerName,
    },
    {
      label: 'Assessment ID',
      value: assessmentId,
    },
  ];

  const allMetadata: AssessmentMetadataItemType[] = [
    ...defaultMetadata,
    ...metadata,
  ];

  return (
    <StyledAssessmentSummary {...rest}>
      <AssessmentSummaryHeader>
        <AssessmentIdentity>
          {companyLogo && <CompanyLogo>{companyLogo}</CompanyLogo>}

          <AssessmentTitleGroup>
            <CompanyName>{companyName}</CompanyName>

            <ApplicationName>{applicationName}</ApplicationName>
          </AssessmentTitleGroup>
        </AssessmentIdentity>

        <AssessmentBadges>
          <SeverityBadge severity={overallRisk} />

          <StatusBadge status={status} />
        </AssessmentBadges>
      </AssessmentSummaryHeader>

      <AssessmentMetadataGrid>
        {allMetadata.map(item => (
          <AssessmentMetadataItemStyled key={item.label}>
            <AssessmentMetadataLabel>{item.label}</AssessmentMetadataLabel>

            <AssessmentMetadataValue>
              {item.icon}
              {item.value}
            </AssessmentMetadataValue>
          </AssessmentMetadataItemStyled>
        ))}
      </AssessmentMetadataGrid>
    </StyledAssessmentSummary>
  );
};

export default AssessmentSummary;

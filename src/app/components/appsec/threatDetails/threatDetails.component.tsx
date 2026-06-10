import React from 'react';

import SeverityBadge from '~/app/components/ui/severityBadge';
import StatusBadge from '~/app/components/ui/statusBadge';
import Badge from '~/app/components/ui/badge';

import StyledThreatDetails, {
  ThreatDetailsActions,
  ThreatDetailsBadges,
  ThreatDetailsHeader,
  ThreatDetailsId,
  ThreatDetailsMetadata,
  ThreatDetailsSection,
  ThreatDetailsSectionBody,
  ThreatDetailsSectionTitle,
  ThreatDetailsTitle,
  ThreatDetailsTitleGroup,
  ThreatMetadataItem,
  ThreatMetadataLabel,
  ThreatMetadataValue,
} from './threatDetails.styled';

import type { ThreatDetailsProps } from './threatDetails.type';

const ThreatDetails = ({
  title,
  threatId,
  severity,
  status,
  strideCategory,
  affectedComponent,
  affectedEndpoint,
  observation,
  risk,
  recommendation,
  references,
  evidence,
  actions,
  ...rest
}: ThreatDetailsProps) => (
  <StyledThreatDetails {...rest}>
    <ThreatDetailsHeader>
      <ThreatDetailsTitleGroup>
        <ThreatDetailsTitle>{title}</ThreatDetailsTitle>

        <ThreatDetailsId>{threatId}</ThreatDetailsId>
      </ThreatDetailsTitleGroup>

      <ThreatDetailsBadges>
        <SeverityBadge severity={severity} />

        <StatusBadge status={status} />

        <Badge label={strideCategory} variant="neutral" size="small" />
      </ThreatDetailsBadges>
    </ThreatDetailsHeader>

    <ThreatDetailsMetadata>
      <ThreatMetadataItem>
        <ThreatMetadataLabel>Component</ThreatMetadataLabel>

        <ThreatMetadataValue>{affectedComponent ?? '—'}</ThreatMetadataValue>
      </ThreatMetadataItem>

      <ThreatMetadataItem>
        <ThreatMetadataLabel>Endpoint</ThreatMetadataLabel>

        <ThreatMetadataValue>{affectedEndpoint ?? '—'}</ThreatMetadataValue>
      </ThreatMetadataItem>
    </ThreatDetailsMetadata>

    <ThreatDetailsSection>
      <ThreatDetailsSectionTitle>Observation</ThreatDetailsSectionTitle>

      <ThreatDetailsSectionBody>{observation}</ThreatDetailsSectionBody>
    </ThreatDetailsSection>

    <ThreatDetailsSection>
      <ThreatDetailsSectionTitle>Risk</ThreatDetailsSectionTitle>

      <ThreatDetailsSectionBody>{risk}</ThreatDetailsSectionBody>
    </ThreatDetailsSection>

    <ThreatDetailsSection>
      <ThreatDetailsSectionTitle>Recommendation</ThreatDetailsSectionTitle>

      <ThreatDetailsSectionBody>{recommendation}</ThreatDetailsSectionBody>
    </ThreatDetailsSection>

    {references && (
      <ThreatDetailsSection>
        <ThreatDetailsSectionTitle>References</ThreatDetailsSectionTitle>

        <ThreatDetailsSectionBody>{references}</ThreatDetailsSectionBody>
      </ThreatDetailsSection>
    )}

    {evidence && (
      <ThreatDetailsSection>
        <ThreatDetailsSectionTitle>Evidence</ThreatDetailsSectionTitle>

        <ThreatDetailsSectionBody>{evidence}</ThreatDetailsSectionBody>
      </ThreatDetailsSection>
    )}

    {actions && <ThreatDetailsActions>{actions}</ThreatDetailsActions>}
  </StyledThreatDetails>
);

export default ThreatDetails;

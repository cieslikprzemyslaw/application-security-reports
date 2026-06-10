import React from 'react';

import SeverityBadge from '~/app/components/ui/severityBadge';
import StatusBadge from '~/app/components/ui/statusBadge';
import Button from '~/app/components/ui/button';

import StyledThreatDrawer, {
  Body,
  CloseButton,
  Header,
  Meta,
  Section,
  SectionTitle,
  Title,
} from './threatDrawer.styled';

import type { ThreatDrawerProps } from './threatDrawer.type';

const ThreatDrawer = ({
  isOpen,
  threat,
  description,
  recommendation,
  onClose,
  onEdit,
}: ThreatDrawerProps) => (
  <StyledThreatDrawer $isOpen={isOpen} aria-hidden={!isOpen}>
    {threat && (
      <>
        <Header>
          <div>
            <Title>{threat.title}</Title>

            <Meta>
              <SeverityBadge severity={threat.severity} size="small" />

              <StatusBadge status={threat.status} size="small" />
            </Meta>
          </div>

          <CloseButton
            type="button"
            aria-label="Close threat details"
            onClick={onClose}
          >
            ×
          </CloseButton>
        </Header>

        <Body>
          <Section>
            <SectionTitle>Application</SectionTitle>

            <p>
              {threat.applicationName}
              {' · '}
              {threat.companyName}
            </p>
          </Section>

          <Section>
            <SectionTitle>STRIDE</SectionTitle>

            <p>{threat.strideCategory}</p>
          </Section>

          {description && (
            <Section>
              <SectionTitle>Observation</SectionTitle>

              {description}
            </Section>
          )}

          {recommendation && (
            <Section>
              <SectionTitle>Recommendation</SectionTitle>

              {recommendation}
            </Section>
          )}

          {onEdit && <Button title="Edit threat" onClick={onEdit} />}
        </Body>
      </>
    )}
  </StyledThreatDrawer>
);

export default ThreatDrawer;

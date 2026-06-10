import styled from 'styled-components';

const StyledThreatDetails = styled.article.attrs({
  className: 'threat-details',
})`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.m};

  padding: ${({ theme }) => theme.spacing.m};

  border: 1px solid ${({ theme }) => theme.colors.border.subtle};

  border-radius: ${({ theme }) => theme.radii.lg};

  background-color: ${({ theme }) => theme.colors.surface.card};
`;

export const ThreatDetailsHeader = styled.header.attrs({
  className: 'threat-details-header',
})`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s};

  @media ${({ theme }) => theme.mq.min.tablet} {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }
`;

export const ThreatDetailsTitleGroup = styled.div.attrs({
  className: 'threat-details-title-group',
})`
  min-width: 0;
`;

export const ThreatDetailsTitle = styled.h2.attrs({
  className: 'threat-details-title',
})`
  font-size: ${({ theme }) => theme.typography.headings.h4.size};

  line-height: ${({ theme }) => theme.typography.headings.h4.lineHeight};
`;

export const ThreatDetailsId = styled.p.attrs({
  className: 'threat-details-id',
})`
  margin-top: 0.125rem;

  font-family: ${({ theme }) => theme.typography.fontFamilies.mono};

  font-size: ${({ theme }) => theme.typography.mono.small.size};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const ThreatDetailsBadges = styled.div.attrs({
  className: 'threat-details-badges',
})`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xxs};
`;

export const ThreatDetailsMetadata = styled.dl.attrs({
  className: 'threat-details-metadata',
})`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: ${({ theme }) => theme.spacing.s};

  margin: 0;
  padding: ${({ theme }) => theme.spacing.s};

  border-radius: ${({ theme }) => theme.radii.md};

  background-color: ${({ theme }) => theme.colors.surface.subtle};
`;

export const ThreatMetadataItem = styled.div.attrs({
  className: 'threat-details-threat-metadata-item',
})``;

export const ThreatMetadataLabel = styled.dt.attrs({
  className: 'threat-details-threat-metadata-label',
})`
  margin-bottom: 0.125rem;

  font-size: ${({ theme }) => theme.typography.body.small.size};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const ThreatMetadataValue = styled.dd.attrs({
  className: 'threat-details-threat-metadata-value',
})`
  margin: 0;

  color: ${({ theme }) => theme.colors.text.primary};
`;

export const ThreatDetailsSection = styled.section.attrs({
  className: 'threat-details-section',
})`
  padding-top: ${({ theme }) => theme.spacing.s};

  border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
`;

export const ThreatDetailsSectionTitle = styled.h3.attrs({
  className: 'threat-details-section-title',
})`
  margin-bottom: ${({ theme }) => theme.spacing.xxs};

  font-size: ${({ theme }) => theme.typography.headings.h6.size};

  line-height: ${({ theme }) => theme.typography.headings.h6.lineHeight};
`;

export const ThreatDetailsSectionBody = styled.div.attrs({
  className: 'threat-details-section-body',
})`
  color: ${({ theme }) => theme.colors.text.secondary};
`;

export const ThreatDetailsActions = styled.div.attrs({
  className: 'threat-details-actions',
})`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xxs};
`;

export default StyledThreatDetails;

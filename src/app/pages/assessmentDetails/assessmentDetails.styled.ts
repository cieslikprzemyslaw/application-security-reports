import styled from 'styled-components';

const StyledAssessmentDetails = styled.div.attrs({
  className: 'assessment-details',
})`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.l};
`;

export const Header = styled.header.attrs({
  className: 'assessment-details-header',
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

export const HeaderActions = styled.div.attrs({
  className: 'assessment-details-header-actions',
})`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xxs};
`;

export const Title = styled.h1.attrs({ className: 'assessment-details-title' })`
  font-size: ${({ theme }) => theme.typography.headings.h3.size};
`;

export const Subtitle = styled.p.attrs({
  className: 'assessment-details-subtitle',
})`
  margin-top: ${({ theme }) => theme.spacing.xxxs};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const SummaryGrid = styled.div.attrs({
  className: 'assessment-details-summary-grid',
})`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: ${({ theme }) => theme.spacing.s};
`;

export const SummaryCard = styled.div.attrs({
  className: 'assessment-details-summary-card',
})`
  padding: ${({ theme }) => theme.spacing.s};

  border: 1px solid ${({ theme }) => theme.colors.border.subtle};

  border-radius: ${({ theme }) => theme.radii.md};

  background-color: ${({ theme }) => theme.colors.surface.card};
`;

export const Section = styled.section.attrs({
  className: 'assessment-details-section',
})`
  overflow: hidden;

  border: 1px solid ${({ theme }) => theme.colors.border.subtle};

  border-radius: ${({ theme }) => theme.radii.lg};

  background-color: ${({ theme }) => theme.colors.surface.card};
`;

export const SectionHeader = styled.header.attrs({
  className: 'assessment-details-section-header',
})`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s};

  padding: ${({ theme }) => theme.spacing.s} ${({ theme }) => theme.spacing.m};

  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
`;

export const SectionBody = styled.div.attrs({
  className: 'assessment-details-section-body',
})`
  padding: ${({ theme }) => theme.spacing.m};
`;

export default StyledAssessmentDetails;

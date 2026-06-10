import styled from 'styled-components';

const StyledAssessments = styled.div.attrs({ className: 'assessments' })`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.l};
`;

export const Header = styled.header.attrs({ className: 'assessments-header' })`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s};

  @media ${({ theme }) => theme.mq.min.tablet} {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }
`;

export const HeaderText = styled.div.attrs({
  className: 'assessments-header-text',
})`
  min-width: 0;
`;

export const Title = styled.h1.attrs({ className: 'assessments-title' })`
  font-size: ${({ theme }) => theme.typography.headings.h3.size};

  line-height: ${({ theme }) => theme.typography.headings.h3.lineHeight};
`;

export const Subtitle = styled.p.attrs({ className: 'assessments-subtitle' })`
  margin-top: ${({ theme }) => theme.spacing.xxxs};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const HeaderActions = styled.div.attrs({
  className: 'assessments-header-actions',
})`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xxs};
`;

export const SearchWrapper = styled.div.attrs({
  className: 'assessments-search-wrapper',
})`
  width: min(100%, 15rem);
`;

export const Card = styled.section.attrs({ className: 'assessments-card' })`
  overflow: hidden;

  border: 1px solid ${({ theme }) => theme.colors.border.subtle};

  border-radius: ${({ theme }) => theme.radii.lg};

  background-color: ${({ theme }) => theme.colors.surface.card};

  box-shadow: ${({ theme }) => theme.shadows.xs};
`;

export const Toolbar = styled.div.attrs({ className: 'assessments-toolbar' })`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxs};

  padding: ${({ theme }) => theme.spacing.s};

  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};

  @media ${({ theme }) => theme.mq.min.tablet} {
    flex-direction: row;
    align-items: center;
  }
`;

export const Filters = styled.div.attrs({ className: 'assessments-filters' })`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xxs};
`;

export const Summary = styled.span.attrs({ className: 'assessments-summary' })`
  margin-left: auto;

  font-size: ${({ theme }) => theme.typography.body.small.size};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const Empty = styled.div.attrs({ className: 'assessments-empty' })`
  padding: ${({ theme }) => theme.spacing.xl};

  color: ${({ theme }) => theme.colors.text.muted};

  text-align: center;
`;

export default StyledAssessments;

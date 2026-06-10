import styled from 'styled-components';

const StyledThreats = styled.div.attrs({ className: 'threats' })`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.l};
`;

export const Header = styled.header.attrs({ className: 'threats-header' })`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s};

  @media ${({ theme }) => theme.mq.min.tablet} {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }
`;

export const Title = styled.h1.attrs({ className: 'threats-title' })`
  font-size: ${({ theme }) => theme.typography.headings.h3.size};
`;

export const Subtitle = styled.p.attrs({ className: 'threats-subtitle' })`
  margin-top: ${({ theme }) => theme.spacing.xxxs};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const HeaderActions = styled.div.attrs({
  className: 'threats-header-actions',
})`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xxs};
`;

export const Card = styled.section.attrs({ className: 'threats-card' })`
  overflow: hidden;

  border: 1px solid ${({ theme }) => theme.colors.border.subtle};

  border-radius: ${({ theme }) => theme.radii.lg};

  background-color: ${({ theme }) => theme.colors.surface.card};

  box-shadow: ${({ theme }) => theme.shadows.xs};
`;

export const Toolbar = styled.div.attrs({ className: 'threats-toolbar' })`
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

export const SearchWrap = styled.div.attrs({
  className: 'threats-search-wrap',
})`
  width: min(100%, 18rem);
`;

export const Filters = styled.div.attrs({ className: 'threats-filters' })`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xxs};
`;

export const Summary = styled.span.attrs({ className: 'threats-summary' })`
  margin-left: auto;

  font-size: ${({ theme }) => theme.typography.body.small.size};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const Footer = styled.div.attrs({ className: 'threats-footer' })`
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: ${({ theme }) => theme.spacing.s};

  border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export default StyledThreats;

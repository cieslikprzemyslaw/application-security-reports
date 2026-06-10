import styled from 'styled-components';

const StyledPage = styled.div.attrs({ className: 'companies-page' })`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.l};
`;

export const PageCard = styled.section.attrs({
  className: 'companies-page-card',
})`
  overflow: hidden;

  border: 1px solid ${({ theme }) => theme.colors.border.subtle};

  border-radius: ${({ theme }) => theme.radii.lg};

  background-color: ${({ theme }) => theme.colors.surface.card};

  box-shadow: ${({ theme }) => theme.shadows.xs};
`;

export const PageCardBody = styled.div.attrs({
  className: 'companies-page-card-body',
})`
  padding: ${({ theme }) => theme.spacing.m};
`;

export const PageGrid = styled.div.attrs({ className: 'companies-page-grid' })`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.s};

  @media ${({ theme }) => theme.mq.min.laptop} {
    grid-template-columns:
      minmax(0, 2fr)
      minmax(18rem, 1fr);
  }
`;

export default StyledPage;

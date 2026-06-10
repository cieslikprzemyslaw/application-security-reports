import styled from 'styled-components';

const StyledEmptyState = styled.div.attrs({ className: 'empty-state' })`
  display: flex;
  flex-direction: column;
  align-items: center;

  padding: ${({ theme }) => theme.spacing.xxl} ${({ theme }) => theme.spacing.m};

  text-align: center;
`;

export const EmptyStateIcon = styled.span.attrs({
  className: 'empty-state-icon',
})`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 3rem;
  height: 3rem;
  margin-bottom: ${({ theme }) => theme.spacing.s};

  border-radius: ${({ theme }) => theme.radii.circle};

  color: ${({ theme }) => theme.colors.brand.primary};
  background-color: ${({ theme }) => theme.colors.brand.wash};

  svg {
    width: 1.5rem;
    height: 1.5rem;
  }
`;

export const EmptyStateTitle = styled.h3.attrs({
  className: 'empty-state-title',
})`
  margin-bottom: ${({ theme }) => theme.spacing.xxxs};

  font-size: ${({ theme }) => theme.typography.headings.h5.size};

  line-height: ${({ theme }) => theme.typography.headings.h5.lineHeight};
`;

export const EmptyStateDescription = styled.p.attrs({
  className: 'empty-state-description',
})`
  max-width: 30rem;

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const EmptyStateActions = styled.div.attrs({
  className: 'empty-state-actions',
})`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xxs};

  margin-top: ${({ theme }) => theme.spacing.m};
`;

export default StyledEmptyState;

import styled from 'styled-components';

export const PaginationNav = styled.nav.attrs({ className: 'pagination-nav' })`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxxs};
`;

export const PaginationButton = styled.button.attrs({
  className: 'pagination-button',
})<{
  $isActive?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  min-width: 2rem;
  height: 2rem;
  padding: 0 0.5rem;

  border: 1px solid
    ${({ theme, $isActive }) =>
      $isActive ? theme.colors.brand.primary : theme.colors.border.default};

  border-radius: ${({ theme }) => theme.radii.md};

  font-size: 0.75rem;
  line-height: 1rem;

  color: ${({ theme, $isActive }) =>
    $isActive ? theme.colors.neutral.white : theme.colors.text.secondary};

  background-color: ${({ theme, $isActive }) =>
    $isActive ? theme.colors.brand.primary : theme.colors.surface.card};

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.brand.primary};

    color: ${({ theme, $isActive }) =>
      $isActive ? theme.colors.neutral.white : theme.colors.brand.primary};
  }

  &:disabled {
    cursor: not-allowed;
    color: ${({ theme }) => theme.colors.neutral.grey400};
    background-color: ${({ theme }) => theme.colors.neutral.grey100};
  }

  svg {
    width: 0.875rem;
    height: 0.875rem;
  }
`;

export const PaginationEllipsis = styled.span.attrs({
  className: 'pagination-ellipsis',
})`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  min-width: 2rem;
  height: 2rem;

  color: ${({ theme }) => theme.colors.text.muted};
`;

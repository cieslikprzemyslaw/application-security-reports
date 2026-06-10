import styled, { css } from 'styled-components';

const StyledPagination = styled.nav`
  ${({ theme: { colors, radii, spacing } }) => css`
    display: flex;
    align-items: center;
    gap: ${spacing.xxxs};

    .pagination-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;

      min-width: 2rem;
      height: 2rem;
      padding: 0 0.5rem;

      border: 1px solid ${colors.border.default};
      border-radius: ${radii.md};

      font-size: 0.75rem;
      line-height: 1rem;
    }

    .pagination-button--active {
      border-color: ${colors.brand.primary};
      color: ${colors.neutral.white};
      background-color: ${colors.brand.primary};
    }

    .pagination-button--inactive {
      color: ${colors.text.secondary};
      background-color: ${colors.surface.card};
    }

    .pagination-button:hover:not(:disabled) {
      border-color: ${colors.brand.primary};
    }

    .pagination-button:hover:not(:disabled).pagination-button--active {
      color: ${colors.neutral.white};
    }

    .pagination-button:hover:not(:disabled).pagination-button--inactive {
      color: ${colors.brand.primary};
    }

    .pagination-button:disabled {
      cursor: not-allowed;
      color: ${colors.neutral.grey400};
      background-color: ${colors.neutral.grey100};
    }

    .pagination-button svg {
      width: 0.875rem;
      height: 0.875rem;
    }

    .pagination-ellipsis {
      display: inline-flex;
      align-items: center;
      justify-content: center;

      min-width: 2rem;
      height: 2rem;

      color: ${colors.text.muted};
    }
  `}
`;

export default StyledPagination;

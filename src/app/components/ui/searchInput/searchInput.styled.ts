import styled, { css } from 'styled-components';

const StyledSearchInput = styled.div`
  ${({ theme: { colors, radii, typography } }) => css`
    position: relative;

    display: flex;
    align-items: center;

    border: 1px solid ${colors.border.default};
    border-radius: ${radii.md};
    background-color: ${colors.surface.card};

    &:focus-within {
      border-color: ${colors.border.focus};
      box-shadow:
        0 0 0 2px ${colors.neutral.white},
        0 0 0 4px ${colors.brand.wash};
    }

    .search-input-search-icon {
      position: absolute;
      left: 0.75rem;

      color: ${colors.text.muted};
      pointer-events: none;
    }

    .search-input-search-icon svg,
    .search-input-clear-button svg {
      width: 1rem;
      height: 1rem;
    }

    .search-input {
      width: 100%;
      min-height: 2.5rem;
      padding: 0.5625rem 2.5rem;

      border: 0;
      outline: 0;

      font-size: ${typography.body.medium.size};
      line-height: ${typography.body.medium.lineHeight};
      color: ${colors.text.primary};
      background: transparent;
    }

    .search-input::placeholder {
      color: ${colors.text.muted};
    }

    .search-input-clear-button {
      position: absolute;
      right: 0.5rem;

      display: inline-flex;
      align-items: center;
      justify-content: center;

      width: 1.75rem;
      height: 1.75rem;
      padding: 0;

      border: 0;
      border-radius: ${radii.md};

      color: ${colors.text.muted};
      background: transparent;
    }

    .search-input-clear-button:hover {
      color: ${colors.text.primary};
      background-color: ${colors.surface.subtle};
    }
  `}
`;

export default StyledSearchInput;

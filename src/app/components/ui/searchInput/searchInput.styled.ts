import styled from 'styled-components';

export const SearchInputWrapper = styled.div.attrs({
  className: 'search-input-wrapper',
})`
  position: relative;

  display: flex;
  align-items: center;

  border: 1px solid ${({ theme }) => theme.colors.border.default};

  border-radius: ${({ theme }) => theme.radii.md};

  background-color: ${({ theme }) => theme.colors.surface.card};

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.border.focus};

    box-shadow:
      0 0 0 2px ${({ theme }) => theme.colors.neutral.white},
      0 0 0 4px ${({ theme }) => theme.colors.brand.wash};
  }
`;

export const SearchIcon = styled.span.attrs({
  className: 'search-input-search-icon',
})`
  position: absolute;
  left: 0.75rem;

  color: ${({ theme }) => theme.colors.text.muted};

  pointer-events: none;

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const StyledSearchInput = styled.input.attrs({
  className: 'search-input',
})`
  width: 100%;
  min-height: 2.5rem;

  padding: 0.5625rem 2.5rem 0.5625rem 2.5rem;

  border: 0;
  outline: 0;

  font-size: ${({ theme }) => theme.typography.body.medium.size};

  line-height: ${({ theme }) => theme.typography.body.medium.lineHeight};

  color: ${({ theme }) => theme.colors.text.primary};
  background: transparent;

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }
`;

export const ClearButton = styled.button.attrs({
  className: 'search-input-clear-button',
})`
  position: absolute;
  right: 0.5rem;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 1.75rem;
  height: 1.75rem;
  padding: 0;

  border: 0;
  border-radius: ${({ theme }) => theme.radii.md};

  color: ${({ theme }) => theme.colors.text.muted};
  background: transparent;

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
    background-color: ${({ theme }) => theme.colors.surface.subtle};
  }

  svg {
    width: 0.875rem;
    height: 0.875rem;
  }
`;

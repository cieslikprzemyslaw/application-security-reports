import styled from 'styled-components';

import type { SelectWrapperStyledProps } from './select.type';

export const SelectField = styled.div.attrs({ className: 'select-field' })`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxxs};
`;

export const SelectLabel = styled.label.attrs({ className: 'select-label' })`
  font-family: ${({ theme }) => theme.typography.fontFamilies.body};

  font-size: ${({ theme }) => theme.typography.label.medium.size};

  line-height: ${({ theme }) => theme.typography.label.medium.lineHeight};

  font-weight: ${({ theme }) => theme.typography.label.medium.weight};

  color: ${({ theme }) => theme.colors.text.primary};
`;

export const SelectDescription = styled.p.attrs({
  className: 'select-description',
})`
  margin: 0;

  font-size: ${({ theme }) => theme.typography.body.small.size};

  line-height: ${({ theme }) => theme.typography.body.small.lineHeight};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const SelectError = styled.p.attrs({ className: 'select-error' })`
  margin: 0;

  font-size: ${({ theme }) => theme.typography.body.small.size};

  line-height: ${({ theme }) => theme.typography.body.small.lineHeight};

  color: ${({ theme }) => theme.colors.feedback.error};
`;

export const SelectWrapper = styled.div.attrs({
  className: 'select-wrapper',
})<SelectWrapperStyledProps>`
  position: relative;

  border: 1px solid
    ${({ theme, $hasError }) =>
      $hasError ? theme.colors.feedback.error : theme.colors.border.default};

  border-radius: ${({ theme }) => theme.radii.md};

  background-color: ${({ theme, $isDisabled }) =>
    $isDisabled ? theme.colors.neutral.grey100 : theme.colors.surface.card};

  transition:
    border-color ${({ theme }) => theme.transitions.fast},
    box-shadow ${({ theme }) => theme.transitions.fast};

  &:focus-within {
    border-color: ${({ theme, $hasError }) =>
      $hasError ? theme.colors.feedback.error : theme.colors.border.focus};

    box-shadow:
      0 0 0 2px ${({ theme }) => theme.colors.neutral.white},
      0 0 0 4px
        ${({ theme, $hasError }) =>
          $hasError
            ? theme.colors.severity.critical.background
            : theme.colors.brand.wash};
  }
`;

export const StyledSelect = styled.select.attrs({ className: 'select' })`
  width: 100%;
  min-height: 2.5rem;

  padding: 0.5625rem 2.5rem 0.5625rem 0.75rem;

  border: 0;
  outline: 0;

  font-size: ${({ theme }) => theme.typography.body.medium.size};

  line-height: ${({ theme }) => theme.typography.body.medium.lineHeight};

  color: ${({ theme }) => theme.colors.text.primary};
  background: transparent;

  appearance: none;

  &:disabled {
    cursor: not-allowed;
    color: ${({ theme }) => theme.colors.text.muted};
  }
`;

export const SelectChevron = styled.span.attrs({ className: 'select-chevron' })`
  position: absolute;
  top: 50%;
  right: 0.75rem;

  width: 1rem;
  height: 1rem;

  color: ${({ theme }) => theme.colors.text.muted};

  pointer-events: none;

  transform: translateY(-50%);

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

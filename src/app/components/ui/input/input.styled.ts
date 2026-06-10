import styled, { css } from 'styled-components';

import type { InputWrapperStyledProps, StyledInputProps } from './input.type';

const getInputSizeStyles = (size: StyledInputProps['$inputSize']) => {
  if (size === 'small') {
    return css`
      min-height: 2rem;
      padding-top: 0.375rem;
      padding-bottom: 0.375rem;

      font-size: 0.75rem;
      line-height: 1rem;
    `;
  }

  if (size === 'large') {
    return css`
      min-height: 3rem;
      padding-top: 0.6875rem;
      padding-bottom: 0.6875rem;

      font-size: 1rem;
      line-height: 1.5rem;
    `;
  }

  return css`
    min-height: 2.5rem;
    padding-top: 0.5625rem;
    padding-bottom: 0.5625rem;

    font-size: 0.875rem;
    line-height: 1.25rem;
  `;
};

export const InputField = styled.div.attrs({ className: 'input-field' })`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxxs};
`;

export const InputLabel = styled.label.attrs({ className: 'input-label' })`
  font-family: ${({ theme }) => theme.typography.fontFamilies.body};

  font-size: ${({ theme }) => theme.typography.label.medium.size};

  line-height: ${({ theme }) => theme.typography.label.medium.lineHeight};

  font-weight: ${({ theme }) => theme.typography.label.medium.weight};

  color: ${({ theme }) => theme.colors.text.primary};
`;

export const InputDescription = styled.p.attrs({
  className: 'input-description',
})`
  margin: 0;

  font-size: ${({ theme }) => theme.typography.body.small.size};

  line-height: ${({ theme }) => theme.typography.body.small.lineHeight};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const InputError = styled.p.attrs({ className: 'input-error' })`
  margin: 0;

  font-size: ${({ theme }) => theme.typography.body.small.size};

  line-height: ${({ theme }) => theme.typography.body.small.lineHeight};

  color: ${({ theme }) => theme.colors.feedback.error};
`;

export const InputWrapper = styled.div.attrs({
  className: 'input-wrapper',
})<InputWrapperStyledProps>`
  position: relative;

  display: flex;
  align-items: center;

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

export const StyledInput = styled.input.attrs({
  className: 'input',
})<StyledInputProps>`
  width: 100%;
  min-width: 0;

  padding-right: ${({ $hasTrailingIcon }) =>
    $hasTrailingIcon ? '2.5rem' : '0.75rem'};

  padding-left: ${({ $hasLeadingIcon }) =>
    $hasLeadingIcon ? '2.5rem' : '0.75rem'};

  border: 0;
  outline: 0;

  color: ${({ theme }) => theme.colors.text.primary};

  background: transparent;

  ${({ $inputSize }) => getInputSizeStyles($inputSize)}

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }

  &:disabled {
    cursor: not-allowed;
    color: ${({ theme }) => theme.colors.text.muted};
  }
`;

export const InputIcon = styled.span.attrs({ className: 'input-icon' })<{
  $position: 'leading' | 'trailing';
}>`
  position: absolute;
  ${({ $position }) =>
    $position === 'leading' ? 'left: 0.75rem;' : 'right: 0.75rem;'}

  display: inline-flex;
  align-items: center;
  justify-content: center;

  color: ${({ theme }) => theme.colors.text.muted};

  pointer-events: none;

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

import styled from 'styled-components';

import type { StyledTextareaProps } from './textarea.type';

export const TextareaField = styled.div.attrs({ className: 'textarea-field' })`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxxs};
`;

export const TextareaLabel = styled.label.attrs({
  className: 'textarea-label',
})`
  font-family: ${({ theme }) => theme.typography.fontFamilies.body};

  font-size: ${({ theme }) => theme.typography.label.medium.size};

  line-height: ${({ theme }) => theme.typography.label.medium.lineHeight};

  font-weight: ${({ theme }) => theme.typography.label.medium.weight};

  color: ${({ theme }) => theme.colors.text.primary};
`;

export const TextareaDescription = styled.p.attrs({
  className: 'textarea-description',
})`
  margin: 0;

  font-size: ${({ theme }) => theme.typography.body.small.size};

  line-height: ${({ theme }) => theme.typography.body.small.lineHeight};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const TextareaError = styled.p.attrs({ className: 'textarea-error' })`
  margin: 0;

  font-size: ${({ theme }) => theme.typography.body.small.size};

  line-height: ${({ theme }) => theme.typography.body.small.lineHeight};

  color: ${({ theme }) => theme.colors.feedback.error};
`;

export const StyledTextarea = styled.textarea.attrs({
  className: 'textarea',
})<StyledTextareaProps>`
  width: 100%;
  min-height: 7.5rem;
  padding: 0.75rem;

  border: 1px solid
    ${({ theme, $hasError }) =>
      $hasError ? theme.colors.feedback.error : theme.colors.border.default};

  border-radius: ${({ theme }) => theme.radii.md};

  font-family: ${({ theme }) => theme.typography.fontFamilies.body};

  font-size: ${({ theme }) => theme.typography.body.medium.size};

  line-height: ${({ theme }) => theme.typography.body.medium.lineHeight};

  color: ${({ theme }) => theme.colors.text.primary};

  background-color: ${({ theme }) => theme.colors.surface.card};

  resize: ${({ $resize }) => $resize};

  transition:
    border-color ${({ theme }) => theme.transitions.fast},
    box-shadow ${({ theme }) => theme.transitions.fast};

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }

  &:focus-visible {
    outline: none;
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

  &:disabled {
    cursor: not-allowed;
    color: ${({ theme }) => theme.colors.text.muted};

    background-color: ${({ theme }) => theme.colors.neutral.grey100};
  }
`;

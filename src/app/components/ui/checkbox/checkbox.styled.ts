import styled from 'styled-components';

export const CheckboxField = styled.div.attrs({ className: 'checkbox-field' })`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxxs};
`;

export const CheckboxLabel = styled.label.attrs({
  className: 'checkbox-label',
})`
  display: inline-flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.xxs};

  width: fit-content;

  cursor: pointer;
`;

export const CheckboxControl = styled.span.attrs({
  className: 'checkbox-control',
})`
  position: relative;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 1rem;
  height: 1rem;
  margin-top: 0.125rem;

  border: 1px solid ${({ theme }) => theme.colors.border.default};

  border-radius: ${({ theme }) => theme.radii.xs};

  background-color: ${({ theme }) => theme.colors.surface.card};

  transition:
    background-color ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast},
    box-shadow ${({ theme }) => theme.transitions.fast};

  svg {
    width: 0.75rem;
    height: 0.75rem;

    color: ${({ theme }) => theme.colors.neutral.white};

    opacity: 0;
  }
`;

export const CheckboxInput = styled.input.attrs({
  className: 'checkbox-input',
})`
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;

  &:checked
    + ${CheckboxControl},
    &[data-indeterminate='true']
    + ${CheckboxControl} {
    border-color: ${({ theme }) => theme.colors.brand.primary};

    background-color: ${({ theme }) => theme.colors.brand.primary};

    svg {
      opacity: 1;
    }
  }

  &:focus-visible + ${CheckboxControl} {
    box-shadow:
      0 0 0 2px ${({ theme }) => theme.colors.neutral.white},
      0 0 0 4px ${({ theme }) => theme.colors.border.focus};
  }

  &:disabled + ${CheckboxControl} {
    border-color: ${({ theme }) => theme.colors.border.subtle};

    background-color: ${({ theme }) => theme.colors.neutral.grey100};
  }

  &:disabled ~ * {
    cursor: not-allowed;
  }
`;

export const CheckboxContent = styled.span.attrs({
  className: 'checkbox-content',
})`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

export const CheckboxText = styled.span.attrs({ className: 'checkbox-text' })`
  font-size: ${({ theme }) => theme.typography.body.medium.size};

  line-height: ${({ theme }) => theme.typography.body.medium.lineHeight};

  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};

  color: ${({ theme }) => theme.colors.text.primary};
`;

export const CheckboxDescription = styled.span.attrs({
  className: 'checkbox-description',
})`
  font-size: ${({ theme }) => theme.typography.body.small.size};

  line-height: ${({ theme }) => theme.typography.body.small.lineHeight};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const CheckboxError = styled.p.attrs({ className: 'checkbox-error' })`
  margin: 0 0 0 1.5rem;

  font-size: ${({ theme }) => theme.typography.body.small.size};

  line-height: ${({ theme }) => theme.typography.body.small.lineHeight};

  color: ${({ theme }) => theme.colors.feedback.error};
`;

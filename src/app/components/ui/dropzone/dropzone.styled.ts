import styled from 'styled-components';

import type { DropzoneStyledProps } from './dropzone.type';

export const DropzoneField = styled.div.attrs({ className: 'dropzone-field' })`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxxs};
`;

export const DropzoneLabel = styled.span.attrs({ className: 'dropzone-label' })`
  font-size: ${({ theme }) => theme.typography.label.medium.size};

  line-height: ${({ theme }) => theme.typography.label.medium.lineHeight};

  font-weight: ${({ theme }) => theme.typography.label.medium.weight};

  color: ${({ theme }) => theme.colors.text.primary};
`;

export const DropzoneArea = styled.label.attrs({
  className: 'dropzone-area',
})<DropzoneStyledProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xxs};

  min-height: 10rem;
  padding: ${({ theme }) => theme.spacing.m};

  border: 1px dashed
    ${({ theme, $hasError, $isDragging }) =>
      $hasError
        ? theme.colors.feedback.error
        : $isDragging
          ? theme.colors.brand.primary
          : theme.colors.border.default};

  border-radius: ${({ theme }) => theme.radii.lg};

  color: ${({ theme }) => theme.colors.text.secondary};

  background-color: ${({ theme, $isDragging, $isDisabled }) =>
    $isDisabled
      ? theme.colors.neutral.grey100
      : $isDragging
        ? theme.colors.brand.wash
        : theme.colors.surface.card};

  cursor: ${({ $isDisabled }) => ($isDisabled ? 'not-allowed' : 'pointer')};

  text-align: center;

  transition:
    border-color ${({ theme }) => theme.transitions.fast},
    background-color ${({ theme }) => theme.transitions.fast};
`;

export const DropzoneIcon = styled.span.attrs({ className: 'dropzone-icon' })`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 2.5rem;
  height: 2.5rem;

  border-radius: ${({ theme }) => theme.radii.circle};

  color: ${({ theme }) => theme.colors.brand.primary};
  background-color: ${({ theme }) => theme.colors.brand.wash};

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

export const DropzoneText = styled.span.attrs({ className: 'dropzone-text' })`
  font-size: ${({ theme }) => theme.typography.body.medium.size};

  line-height: ${({ theme }) => theme.typography.body.medium.lineHeight};

  color: ${({ theme }) => theme.colors.text.secondary};
`;

export const DropzoneDescription = styled.span.attrs({
  className: 'dropzone-description',
})`
  font-size: ${({ theme }) => theme.typography.body.small.size};

  line-height: ${({ theme }) => theme.typography.body.small.lineHeight};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const DropzoneInput = styled.input.attrs({
  className: 'dropzone-input',
})`
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
`;

export const DropzoneError = styled.p.attrs({ className: 'dropzone-error' })`
  margin: 0;

  font-size: ${({ theme }) => theme.typography.body.small.size};

  color: ${({ theme }) => theme.colors.feedback.error};
`;

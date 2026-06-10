import styled, { css } from 'styled-components';

import type { ToastStyledProps, ToastVariant } from './toast.type';

const getToastStyles = (variant: ToastVariant) => css`
  ${({ theme }) => {
    const variants = {
      success: {
        border: theme.colors.severity.low.solid,
        icon: theme.colors.severity.low.text,
      },
      warning: {
        border: theme.colors.severity.medium.solid,
        icon: theme.colors.severity.medium.text,
      },
      error: {
        border: theme.colors.severity.critical.solid,
        icon: theme.colors.severity.critical.text,
      },
      info: {
        border: theme.colors.severity.informational.solid,
        icon: theme.colors.severity.informational.text,
      },
    } as const;

    const selectedVariant = variants[variant];

    return css`
      border-left-color: ${selectedVariant.border};

      .toast-icon {
        color: ${selectedVariant.icon};
      }
    `;
  }}
`;

const StyledToast = styled.div.attrs({ className: 'toast' })<ToastStyledProps>`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: ${({ theme }) => theme.spacing.xxs};

  width: min(100%, 24rem);
  padding: ${({ theme }) => theme.spacing.s};

  border: 1px solid ${({ theme }) => theme.colors.border.subtle};

  border-left-width: 0.25rem;
  border-radius: ${({ theme }) => theme.radii.md};

  background-color: ${({ theme }) => theme.colors.surface.card};

  box-shadow: ${({ theme }) => theme.shadows.md};

  ${({ $variant }) => getToastStyles($variant)}
`;

export const ToastIcon = styled.span.attrs({ className: 'toast-icon' })`
  display: inline-flex;

  svg {
    width: 1.125rem;
    height: 1.125rem;
  }
`;

export const ToastContent = styled.div.attrs({ className: 'toast-content' })`
  min-width: 0;
`;

export const ToastTitle = styled.h4.attrs({ className: 'toast-title' })`
  font-size: ${({ theme }) => theme.typography.headings.h6.size};

  line-height: ${({ theme }) => theme.typography.headings.h6.lineHeight};
`;

export const ToastDescription = styled.p.attrs({
  className: 'toast-description',
})`
  margin-top: 0.125rem;

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const ToastActions = styled.div.attrs({ className: 'toast-actions' })`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.xxxs};
`;

export const ToastDismissButton = styled.button.attrs({
  className: 'toast-dismiss-button',
})`
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

export default StyledToast;

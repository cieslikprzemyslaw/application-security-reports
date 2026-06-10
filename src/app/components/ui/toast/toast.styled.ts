import { styled, css } from 'styled-components';

import type { ToastVariant } from './toast.type';

const getToastStyles = (variant: ToastVariant) => css`
  ${({ theme: { colors } }) => {
    const variants = {
      success: {
        border: colors.severity.low.solid,
        icon: colors.severity.low.text,
      },
      warning: {
        border: colors.severity.medium.solid,
        icon: colors.severity.medium.text,
      },
      error: {
        border: colors.severity.critical.solid,
        icon: colors.severity.critical.text,
      },
      info: {
        border: colors.severity.informational.solid,
        icon: colors.severity.informational.text,
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

const StyledToast = styled.div`
  ${({ theme: { colors, radii, shadows, spacing, typography } }) => css`
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: ${spacing.xxs};

    width: min(100%, 24rem);
    padding: ${spacing.s};

    border: 1px solid ${colors.border.subtle};
    border-left-width: 0.25rem;
    border-radius: ${radii.md};
    background-color: ${colors.surface.card};
    box-shadow: ${shadows.md};

    .toast-icon {
      display: inline-flex;
    }

    .toast-icon svg {
      width: 1.125rem;
      height: 1.125rem;
    }

    .toast-content {
      min-width: 0;
    }

    .toast-title {
      font-size: ${typography.headings.h6.size};
      line-height: ${typography.headings.h6.lineHeight};
    }

    .toast-description {
      margin-top: 0.125rem;
      color: ${colors.text.muted};
    }

    .toast-actions {
      display: flex;
      align-items: flex-start;
      gap: ${spacing.xxxs};
    }

    .toast-dismiss-button {
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

    .toast-dismiss-button:hover {
      color: ${colors.text.primary};
      background-color: ${colors.surface.subtle};
    }

    .toast-dismiss-button svg {
      width: 0.875rem;
      height: 0.875rem;
    }

    &.toast--success {
      ${getToastStyles('success')}
    }

    &.toast--warning {
      ${getToastStyles('warning')}
    }

    &.toast--error {
      ${getToastStyles('error')}
    }

    &.toast--info {
      ${getToastStyles('info')}
    }
  `}
`;

export default StyledToast;

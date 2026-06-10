import { styled, css } from 'styled-components';

import type { CalloutVariant } from './callout.type';

const getVariantStyles = (variant: CalloutVariant) => css`
  ${({ theme: { colors } }) => {
    const variants = {
      info: {
        border: colors.severity.informational.solid,
        background: colors.severity.informational.background,
        icon: colors.severity.informational.text,
      },
      success: {
        border: colors.severity.low.solid,
        background: colors.severity.low.background,
        icon: colors.severity.low.text,
      },
      warning: {
        border: colors.severity.medium.solid,
        background: colors.severity.medium.background,
        icon: colors.severity.medium.text,
      },
      error: {
        border: colors.severity.critical.solid,
        background: colors.severity.critical.background,
        icon: colors.severity.critical.text,
      },
      neutral: {
        border: colors.border.strong,
        background: colors.neutral.grey100,
        icon: colors.text.secondary,
      },
    } as const;

    const selectedVariant = variants[variant];

    return css`
      border-left-color: ${selectedVariant.border};
      background-color: ${selectedVariant.background};

      .callout-icon {
        color: ${selectedVariant.icon};
      }
    `;
  }}
`;

const StyledCallout = styled.div`
  ${({ theme: { colors, radii, spacing, typography } }) => css`
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: ${spacing.s};

    padding: ${spacing.s};

    border-left: 0.25rem solid;
    border-radius: ${radii.md};

    .callout-icon {
      display: inline-flex;
      align-items: flex-start;
      justify-content: center;
      width: 1.25rem;
      height: 1.25rem;
    }

    .callout-icon svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    .callout-content {
      min-width: 0;
    }

    .callout-title {
      margin-bottom: ${spacing.xxxs};
      font-size: ${typography.headings.h6.size};
      line-height: ${typography.headings.h6.lineHeight};
    }

    .callout-body {
      color: ${colors.text.secondary};
    }

    .callout-actions {
      display: inline-flex;
      align-items: flex-start;
      gap: ${spacing.xxs};
    }

    &.callout--info {
      ${getVariantStyles('info')}
    }

    &.callout--success {
      ${getVariantStyles('success')}
    }

    &.callout--warning {
      ${getVariantStyles('warning')}
    }

    &.callout--error {
      ${getVariantStyles('error')}
    }

    &.callout--neutral {
      ${getVariantStyles('neutral')}
    }
  `}
`;

export default StyledCallout;

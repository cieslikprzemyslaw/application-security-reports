import { styled, css } from 'styled-components';

import type { BadgeSize, BadgeStyledProps, BadgeVariant } from './badge.type';

const getVariantStyles = (variant: BadgeVariant) => css`
  ${({ theme: { colors } }) => {
    const variants = {
      neutral: {
        background: colors.neutral.grey100,
        text: colors.neutral.grey700,
        dot: colors.neutral.grey500,
      },
      brand: {
        background: colors.brand.wash,
        text: colors.brand.primary,
        dot: colors.brand.primary,
      },
      success: {
        background: colors.severity.low.background,
        text: colors.severity.low.text,
        dot: colors.severity.low.solid,
      },
      warning: {
        background: colors.severity.medium.background,
        text: colors.severity.medium.text,
        dot: colors.severity.medium.solid,
      },
      error: {
        background: colors.severity.critical.background,
        text: colors.severity.critical.text,
        dot: colors.severity.critical.solid,
      },
      info: {
        background: colors.severity.informational.background,
        text: colors.severity.informational.text,
        dot: colors.severity.informational.solid,
      },
    } as const;

    const selectedVariant = variants[variant];

    return css`
      color: ${selectedVariant.text};
      background-color: ${selectedVariant.background};

      .badge-dot {
        background-color: ${selectedVariant.dot};
      }
    `;
  }}
`;

const getSizeStyles = (size: BadgeSize) => {
  if (size === 'small') {
    return css`
      min-height: 1.25rem;
      padding: 0.125rem 0.5rem;

      font-size: 0.75rem;
      line-height: 1rem;
    `;
  }

  return css`
    min-height: 1.5rem;
    padding: 0.125rem 0.625rem;

    font-size: 0.875rem;
    line-height: 1.25rem;
  `;
};

const StyledBadge = styled.span.attrs({ className: 'badge' })<BadgeStyledProps>`
  ${({ theme: { radii, spacing, typography }, $variant, $size }) => css`
    display: inline-flex;
    align-items: center;
    gap: ${spacing.xxxs};

    width: fit-content;
    border-radius: ${radii.pill};

    font-family: ${typography.fontFamilies.body};
    font-weight: ${typography.fontWeights.medium};
    white-space: nowrap;

    ${getVariantStyles($variant)}
    ${getSizeStyles($size)}

    svg {
      width: 0.875rem;
      height: 0.875rem;
      flex-shrink: 0;
    }

    .badge-dot {
      width: 0.375rem;
      height: 0.375rem;
      flex-shrink: 0;

      border-radius: ${radii.circle};

      background-color: currentColor;
    }
  `}
`;

export default StyledBadge;

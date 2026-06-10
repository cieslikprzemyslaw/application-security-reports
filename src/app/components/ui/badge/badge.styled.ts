import styled, { css } from 'styled-components';

import type { BadgeSize, BadgeStyledProps, BadgeVariant } from './badge.type';

const getVariantStyles = (variant: BadgeVariant) => css`
  ${({ theme }) => {
    const variants = {
      neutral: {
        background: theme.colors.neutral.grey100,
        text: theme.colors.neutral.grey700,
        dot: theme.colors.neutral.grey500,
      },
      brand: {
        background: theme.colors.brand.wash,
        text: theme.colors.brand.primary,
        dot: theme.colors.brand.primary,
      },
      success: {
        background: theme.colors.severity.low.background,
        text: theme.colors.severity.low.text,
        dot: theme.colors.severity.low.solid,
      },
      warning: {
        background: theme.colors.severity.medium.background,
        text: theme.colors.severity.medium.text,
        dot: theme.colors.severity.medium.solid,
      },
      error: {
        background: theme.colors.severity.critical.background,
        text: theme.colors.severity.critical.text,
        dot: theme.colors.severity.critical.solid,
      },
      info: {
        background: theme.colors.severity.informational.background,
        text: theme.colors.severity.informational.text,
        dot: theme.colors.severity.informational.solid,
      },
    } as const;

    const selectedVariant = variants[variant];

    return css`
      color: ${selectedVariant.text};
      background-color: ${selectedVariant.background};

      &::before {
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
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxxs};

  width: fit-content;
  border-radius: ${({ theme }) => theme.radii.pill};

  font-family: ${({ theme }) => theme.typography.fontFamilies.body};

  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};

  white-space: nowrap;

  ${({ $variant }) => getVariantStyles($variant)}

  ${({ $size }) => getSizeStyles($size)}

  svg {
    width: 0.875rem;
    height: 0.875rem;
    flex-shrink: 0;
  }
`;

export const BadgeDot = styled.span.attrs({ className: 'badge-dot' })`
  width: 0.375rem;
  height: 0.375rem;
  flex-shrink: 0;

  border-radius: ${({ theme }) => theme.radii.circle};

  background-color: currentColor;
`;

export default StyledBadge;

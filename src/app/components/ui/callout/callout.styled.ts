import styled, { css } from 'styled-components';

import type { CalloutStyledProps, CalloutVariant } from './callout.type';

const getVariantStyles = (variant: CalloutVariant) => css`
  ${({ theme }) => {
    const variants = {
      info: {
        border: theme.colors.severity.informational.solid,
        background: theme.colors.severity.informational.background,
        icon: theme.colors.severity.informational.text,
      },
      success: {
        border: theme.colors.severity.low.solid,
        background: theme.colors.severity.low.background,
        icon: theme.colors.severity.low.text,
      },
      warning: {
        border: theme.colors.severity.medium.solid,
        background: theme.colors.severity.medium.background,
        icon: theme.colors.severity.medium.text,
      },
      error: {
        border: theme.colors.severity.critical.solid,
        background: theme.colors.severity.critical.background,
        icon: theme.colors.severity.critical.text,
      },
      neutral: {
        border: theme.colors.border.strong,
        background: theme.colors.neutral.grey100,
        icon: theme.colors.text.secondary,
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

const StyledCallout = styled.div.attrs({
  className: 'callout',
})<CalloutStyledProps>`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: ${({ theme }) => theme.spacing.s};

  padding: ${({ theme }) => theme.spacing.s};

  border-left: 0.25rem solid;
  border-radius: ${({ theme }) => theme.radii.md};

  ${({ $variant }) => getVariantStyles($variant)}
`;

export const CalloutIcon = styled.span.attrs({ className: 'callout-icon' })`
  display: inline-flex;
  align-items: flex-start;
  justify-content: center;

  width: 1.25rem;
  height: 1.25rem;

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

export const CalloutContent = styled.div.attrs({
  className: 'callout-content',
})`
  min-width: 0;
`;

export const CalloutTitle = styled.h4.attrs({ className: 'callout-title' })`
  margin-bottom: ${({ theme }) => theme.spacing.xxxs};

  font-size: ${({ theme }) => theme.typography.headings.h6.size};

  line-height: ${({ theme }) => theme.typography.headings.h6.lineHeight};
`;

export const CalloutBody = styled.div.attrs({ className: 'callout-body' })`
  color: ${({ theme }) => theme.colors.text.secondary};
`;

export const CalloutActions = styled.div.attrs({
  className: 'callout-actions',
})`
  display: inline-flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.xxs};
`;

export default StyledCallout;

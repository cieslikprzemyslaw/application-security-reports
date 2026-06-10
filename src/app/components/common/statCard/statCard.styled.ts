import styled, { css } from 'styled-components';

import type {
  StatCardIconStyledProps,
  StatIconTone,
  StatTrendValueStyledProps,
} from './statCard.type';

const getIconToneStyles = (tone: StatIconTone) => css`
  ${({ theme }) => {
    const tones = {
      brand: {
        color: theme.colors.brand.primary,
        background: theme.colors.brand.wash,
      },
      critical: {
        color: theme.colors.severity.critical.text,
        background: theme.colors.severity.critical.background,
      },
      high: {
        color: theme.colors.severity.high.text,
        background: theme.colors.severity.high.background,
      },
      medium: {
        color: theme.colors.severity.medium.text,
        background: theme.colors.severity.medium.background,
      },
      low: {
        color: theme.colors.severity.low.text,
        background: theme.colors.severity.low.background,
      },
      informational: {
        color: theme.colors.severity.informational.text,
        background: theme.colors.severity.informational.background,
      },
      purple: {
        color: theme.colors.status.retestRequired.text,
        background: theme.colors.status.retestRequired.background,
      },
      neutral: {
        color: theme.colors.text.secondary,
        background: theme.colors.neutral.grey100,
      },
    } as const;

    const selectedTone = tones[tone];

    return css`
      color: ${selectedTone.color};
      background-color: ${selectedTone.background};
    `;
  }}
`;

export const StyledStatCard = styled.div.attrs({ className: 'stat-card' })`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s};

  padding: ${({ theme }) => theme.spacing.m};

  border: 1px solid ${({ theme }) => theme.colors.border.subtle};

  border-radius: ${({ theme }) => theme.radii.lg};

  background-color: ${({ theme }) => theme.colors.surface.card};

  box-shadow: ${({ theme }) => theme.shadows.xs};
`;

export const StatCardTop = styled.div.attrs({ className: 'stat-card-top' })`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxs};
`;

export const StatCardIcon = styled.span.attrs({
  className: 'stat-card-icon',
})<StatCardIconStyledProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 2rem;
  height: 2rem;
  flex-shrink: 0;

  border-radius: ${({ theme }) => theme.radii.md};

  ${({ $tone }) => getIconToneStyles($tone)}

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const StatCardLabel = styled.span.attrs({
  className: 'stat-card-label',
})`
  font-size: ${({ theme }) => theme.typography.body.small.size};

  line-height: ${({ theme }) => theme.typography.body.small.lineHeight};

  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const StatCardValue = styled.strong.attrs({
  className: 'stat-card-value',
})`
  font-size: ${({ theme }) => theme.typography.headings.h2.size};

  line-height: ${({ theme }) => theme.typography.headings.h2.lineHeight};

  font-weight: ${({ theme }) => theme.typography.headings.h2.weight};

  color: ${({ theme }) => theme.colors.text.primary};
`;

export const StatCardFooter = styled.div.attrs({
  className: 'stat-card-footer',
})`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxxs};

  font-size: ${({ theme }) => theme.typography.body.small.size};

  line-height: ${({ theme }) => theme.typography.body.small.lineHeight};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const StatTrendValue = styled.span.attrs({
  className: 'stat-card-stat-trend-value',
})<StatTrendValueStyledProps>`
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;

  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};

  color: ${({ theme, $tone }) => {
    if ($tone === 'positive') {
      return theme.colors.feedback.success;
    }

    if ($tone === 'negative') {
      return theme.colors.feedback.error;
    }

    return theme.colors.text.muted;
  }};

  svg {
    width: 0.75rem;
    height: 0.75rem;
    flex-shrink: 0;
  }
`;

import { styled, css } from 'styled-components';

import type { StatIconTone, StatTrendTone } from './statCard.type';

const getIconToneStyles = (
  tone: StatIconTone,
  colors: {
    brand: { primary: string; wash: string };
    severity: {
      critical: { text: string; background: string };
      high: { text: string; background: string };
      medium: { text: string; background: string };
      low: { text: string; background: string };
      informational: { text: string; background: string };
    };
    status: {
      retestRequired: { text: string; background: string };
    };
    text: { secondary: string; muted: string; primary: string };
    neutral: { grey100: string };
  },
) => {
  const tones = {
    brand: {
      color: colors.brand.primary,
      background: colors.brand.wash,
    },
    critical: {
      color: colors.severity.critical.text,
      background: colors.severity.critical.background,
    },
    high: {
      color: colors.severity.high.text,
      background: colors.severity.high.background,
    },
    medium: {
      color: colors.severity.medium.text,
      background: colors.severity.medium.background,
    },
    low: {
      color: colors.severity.low.text,
      background: colors.severity.low.background,
    },
    informational: {
      color: colors.severity.informational.text,
      background: colors.severity.informational.background,
    },
    purple: {
      color: colors.status.retestRequired.text,
      background: colors.status.retestRequired.background,
    },
    neutral: {
      color: colors.text.secondary,
      background: colors.neutral.grey100,
    },
  } as const;

  return tones[tone];
};

const StyledStatCard = styled.div.attrs({ className: 'stat-card' })<{
  $iconTone: StatIconTone;
  $trendTone: StatTrendTone;
}>`
  ${({
    theme: { colors, radii, shadows, spacing, typography },
    $iconTone,
    $trendTone,
  }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.s};

    padding: ${spacing.m};

    border: 1px solid ${colors.border.subtle};
    border-radius: ${radii.lg};
    background-color: ${colors.surface.card};
    box-shadow: ${shadows.xs};

    .stat-card-top {
      display: flex;
      align-items: center;
      gap: ${spacing.xxs};
    }

    .stat-card-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;

      width: 2rem;
      height: 2rem;
      flex-shrink: 0;

      border-radius: ${radii.md};

      color: ${getIconToneStyles($iconTone, colors).color};
      background-color: ${getIconToneStyles($iconTone, colors).background};
    }

    .stat-card-icon svg {
      width: 1rem;
      height: 1rem;
    }

    .stat-card-label {
      font-size: ${typography.body.small.size};
      line-height: ${typography.body.small.lineHeight};
      font-weight: ${typography.fontWeights.medium};
      color: ${colors.text.muted};
    }

    .stat-card-value {
      font-size: ${typography.headings.h2.size};
      line-height: ${typography.headings.h2.lineHeight};
      font-weight: ${typography.headings.h2.weight};
      color: ${colors.text.primary};
    }

    .stat-card-footer {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: ${spacing.xxxs};

      font-size: ${typography.body.small.size};
      line-height: ${typography.body.small.lineHeight};
      color: ${colors.text.muted};
    }

    .stat-card-stat-trend-value {
      display: inline-flex;
      align-items: center;
      gap: 0.125rem;

      font-weight: ${typography.fontWeights.semibold};

      color: ${$trendTone === 'positive'
        ? colors.feedback.success
        : $trendTone === 'negative'
          ? colors.feedback.error
          : colors.text.muted};
    }

    .stat-card-stat-trend-value svg {
      width: 0.75rem;
      height: 0.75rem;
      flex-shrink: 0;
    }
  `}
`;

export default StyledStatCard;

import styled, { css } from 'styled-components';

import type { ActivityTone } from './activityFeed.type';

const getToneStyles = (tone: ActivityTone) => css`
  ${({ theme: { colors } }) => {
    const tones = {
      brand: {
        color: colors.brand.primary,
        background: colors.brand.wash,
      },
      success: {
        color: colors.severity.low.text,
        background: colors.severity.low.background,
      },
      warning: {
        color: colors.severity.medium.text,
        background: colors.severity.medium.background,
      },
      error: {
        color: colors.severity.critical.text,
        background: colors.severity.critical.background,
      },
      neutral: {
        color: colors.text.secondary,
        background: colors.neutral.grey100,
      },
    } as const;

    const selectedTone = tones[tone];

    return css`
      color: ${selectedTone.color};
      background-color: ${selectedTone.background};
    `;
  }}
`;

const StyledActivityFeed = styled.div.attrs({ className: 'activity-feed' })`
  ${({ theme: { colors, radii, spacing, typography } }) => css`
    display: flex;
    flex-direction: column;

    .activity-feed-item {
      position: relative;

      display: grid;
      grid-template-columns: 2rem minmax(0, 1fr);
      gap: ${spacing.xxs};

      padding: 0 0 ${spacing.m};
    }

    .activity-feed-item:not(:last-child)::after {
      content: '';

      position: absolute;
      top: 2rem;
      left: calc(1rem - 0.5px);

      width: 1px;
      height: calc(100% - 2rem);

      background-color: ${colors.border.subtle};
    }

    .activity-feed-item:last-child {
      padding-bottom: 0;
    }

    .activity-feed-icon {
      position: relative;
      z-index: 1;

      display: inline-flex;
      align-items: center;
      justify-content: center;

      width: 2rem;
      height: 2rem;

      border: 1px solid;
      border-radius: ${radii.circle};

      svg {
        width: 0.875rem;
        height: 0.875rem;
      }
    }

    .activity-feed-icon--brand {
      ${getToneStyles('brand')}
    }

    .activity-feed-icon--success {
      ${getToneStyles('success')}
    }

    .activity-feed-icon--warning {
      ${getToneStyles('warning')}
    }

    .activity-feed-icon--error {
      ${getToneStyles('error')}
    }

    .activity-feed-icon--neutral {
      ${getToneStyles('neutral')}
    }

    .activity-feed-content {
      min-width: 0;
      padding-top: 0.125rem;
    }

    .activity-feed-title {
      color: ${colors.text.secondary};
    }

    .activity-feed-title strong {
      color: ${colors.text.primary};
    }

    .activity-feed-meta {
      margin-top: 0.125rem;

      font-size: ${typography.body.small.size};
      line-height: ${typography.body.small.lineHeight};
      color: ${colors.text.muted};
    }

    .activity-feed-empty {
      padding: ${spacing.l};
      color: ${colors.text.muted};
      text-align: center;
    }
  `}
`;

export default StyledActivityFeed;

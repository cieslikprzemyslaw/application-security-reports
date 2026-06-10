import styled, { css } from 'styled-components';

import type {
  ActivityFeedIconStyledProps,
  ActivityTone,
} from './activityFeed.type';

const getToneStyles = (tone: ActivityTone) => css`
  ${({ theme }) => {
    const tones = {
      brand: {
        color: theme.colors.brand.primary,
        background: theme.colors.brand.wash,
      },
      success: {
        color: theme.colors.severity.low.text,
        background: theme.colors.severity.low.background,
      },
      warning: {
        color: theme.colors.severity.medium.text,
        background: theme.colors.severity.medium.background,
      },
      error: {
        color: theme.colors.severity.critical.text,
        background: theme.colors.severity.critical.background,
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

export const StyledActivityFeed = styled.div.attrs({
  className: 'activity-feed',
})`
  display: flex;
  flex-direction: column;
`;

export const ActivityFeedItem = styled.div.attrs({
  className: 'activity-feed-item',
})`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing.xxs};

  padding: ${({ theme }) => theme.spacing.s} 0;

  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};

  &:last-child {
    border-bottom: 0;
  }
`;

export const ActivityFeedIcon = styled.span.attrs({
  className: 'activity-feed-icon',
})<ActivityFeedIconStyledProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 2rem;
  height: 2rem;

  border-radius: ${({ theme }) => theme.radii.circle};

  ${({ $tone }) => getToneStyles($tone)}

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const ActivityFeedContent = styled.div.attrs({
  className: 'activity-feed-content',
})`
  min-width: 0;
`;

export const ActivityFeedTitle = styled.div.attrs({
  className: 'activity-feed-title',
})`
  color: ${({ theme }) => theme.colors.text.secondary};
`;

export const ActivityFeedMeta = styled.div.attrs({
  className: 'activity-feed-meta',
})`
  margin-top: 0.125rem;

  font-size: ${({ theme }) => theme.typography.body.small.size};

  line-height: ${({ theme }) => theme.typography.body.small.lineHeight};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const ActivityFeedEmpty = styled.div.attrs({
  className: 'activity-feed-empty',
})`
  padding: ${({ theme }) => theme.spacing.l};

  color: ${({ theme }) => theme.colors.text.muted};

  text-align: center;
`;

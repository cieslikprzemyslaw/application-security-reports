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
        border: theme.colors.border.focus,
      },
      success: {
        color: theme.colors.severity.low.text,
        background: theme.colors.severity.low.background,
        border: theme.colors.severity.low.solid,
      },
      warning: {
        color: theme.colors.severity.medium.text,
        background: theme.colors.severity.medium.background,
        border: theme.colors.severity.medium.solid,
      },
      error: {
        color: theme.colors.severity.critical.text,
        background: theme.colors.severity.critical.background,
        border: theme.colors.severity.critical.solid,
      },
      neutral: {
        color: theme.colors.text.secondary,
        background: theme.colors.neutral.grey100,
        border: theme.colors.border.default,
      },
    } as const;

    const selectedTone = tones[tone];

    return css`
      color: ${selectedTone.color};
      background-color: ${selectedTone.background};
      border-color: ${selectedTone.border};
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
  position: relative;

  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing.xxs};

  padding: 0 0 ${({ theme }) => theme.spacing.m};

  &:not(:last-child)::after {
    content: '';

    position: absolute;
    top: 2rem;
    left: calc(1rem - 0.5px);

    width: 1px;
    height: calc(100% - 2rem);

    background-color: ${({ theme }) => theme.colors.border.subtle};
  }

  &:last-child {
    padding-bottom: 0;
  }
`;

export const ActivityFeedIcon = styled.span.attrs({
  className: 'activity-feed-icon',
})<ActivityFeedIconStyledProps>`
  position: relative;
  z-index: 1;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 2rem;
  height: 2rem;

  border: 1px solid;
  border-radius: ${({ theme }) => theme.radii.circle};

  ${({ $tone }) => getToneStyles($tone)}

  svg {
    width: 0.875rem;
    height: 0.875rem;
  }
`;

export const ActivityFeedContent = styled.div.attrs({
  className: 'activity-feed-content',
})`
  min-width: 0;
  padding-top: 0.125rem;
`;

export const ActivityFeedTitle = styled.div.attrs({
  className: 'activity-feed-title',
})`
  color: ${({ theme }) => theme.colors.text.secondary};

  strong {
    color: ${({ theme }) => theme.colors.text.primary};
  }
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

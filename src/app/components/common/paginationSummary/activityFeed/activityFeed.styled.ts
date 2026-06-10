import styled, { css } from 'styled-components';

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

      &:not(:last-child)::after {
        content: '';
        position: absolute;
        top: 2rem;
        left: calc(1rem - 0.5px);
        width: 1px;
        height: calc(100% - 2rem);
        background-color: ${colors.border.subtle};
      }

      &:last-child {
        padding-bottom: 0;
      }
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
    }

    .activity-feed-content {
      min-width: 0;
      padding-top: 0.125rem;
    }

    .activity-feed-title {
      color: ${colors.text.secondary};

      strong {
        color: ${colors.text.primary};
      }
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

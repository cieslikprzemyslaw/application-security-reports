import { css, styled } from 'styled-components';

const StyledWorkspaceContextNavigation = styled.nav`
  ${({ theme: { colors, radii, spacing, typography } }) => css`
    min-width: 0;
    margin-bottom: ${spacing.xxs};

    .workspace-context-navigation__list {
      display: flex;
      align-items: center;
      gap: ${spacing.xxxs};
      min-width: 0;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .workspace-context-navigation__item {
      display: inline-flex;
      align-items: center;
      gap: ${spacing.xxxs};
      min-width: 0;
      color: ${colors.text.muted};
      font-size: ${typography.body.small.size};
      line-height: ${typography.body.small.lineHeight};
    }

    .workspace-context-navigation__item:not(:last-child)::after {
      content: '/';
      flex: 0 0 auto;
      color: ${colors.neutral.grey400};
    }

    .workspace-context-navigation__link,
    .workspace-context-navigation__current,
    .workspace-context-navigation__item > span {
      display: block;
      min-width: 0;
      max-width: min(18rem, 32vw);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .workspace-context-navigation__link {
      padding: 0;
      border: 0;
      border-radius: ${radii.sm};
      color: ${colors.text.link};
      background: transparent;
      text-decoration: none;
    }

    .workspace-context-navigation__link:hover {
      text-decoration: underline;
    }

    .workspace-context-navigation__link:focus-visible {
      outline: 2px solid ${colors.border.focus};
      outline-offset: 2px;
    }

    .workspace-context-navigation__current {
      color: ${colors.text.primary};
      font-weight: ${typography.fontWeights.semibold};
    }
  `}
`;

export default StyledWorkspaceContextNavigation;

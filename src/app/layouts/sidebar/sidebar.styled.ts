import styled, { css } from 'styled-components';

const StyledSidebar = styled.nav.attrs({ className: 'sidebar' })`
  ${({
    theme: { colors, layoutSizes, radii, spacing, transitions, typography },
  }) => css`
    display: flex;
    flex-direction: column;

    width: 100%;
    height: 100%;
    min-height: 100vh;

    color: ${colors.text.inverse};
    background-color: ${colors.surface.inverse};

    .sidebar-brand {
      display: flex;
      align-items: center;

      min-height: ${layoutSizes.topbarHeight};
      padding: 0 ${spacing.s};

      border-bottom: 1px solid rgb(255 255 255 / 10%);
    }

    .sidebar-body {
      flex: 1;
      overflow-y: auto;
      padding: ${spacing.s};
    }

    .sidebar-group + .sidebar-group {
      margin-top: ${spacing.m};
    }

    .sidebar-group-label {
      margin: 0 0 ${spacing.xxs};
      padding: 0 ${spacing.xxs};

      font-size: ${typography.label.small.size};
      line-height: ${typography.label.small.lineHeight};
      font-weight: ${typography.label.small.weight};
      color: ${colors.neutral.grey400};

      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .sidebar-list {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xxxs};

      margin: 0;
      padding: 0;

      list-style: none;
    }

    .sidebar-link,
    .sidebar-button {
      display: flex;
      align-items: center;
      gap: ${spacing.xxs};

      min-height: 2.5rem;
      padding: 0.5rem 0.75rem;

      border: 0;
      border-radius: ${radii.md};

      text-decoration: none;
      text-align: left;
      transition:
        color ${transitions.fast},
        background-color ${transitions.fast};
    }

    .sidebar-link {
      color: ${colors.neutral.grey300};
      background-color: transparent;
    }

    .sidebar-link--active {
      color: ${colors.neutral.white};
      background-color: rgb(255 255 255 / 10%);
    }

    .sidebar-link:hover {
      color: ${colors.neutral.white};
      background-color: rgb(255 255 255 / 8%);
    }

    .sidebar-button {
      width: 100%;
      color: ${colors.neutral.grey300};
      background-color: transparent;
    }

    .sidebar-button--active {
      color: ${colors.neutral.white};
      background-color: rgb(255 255 255 / 10%);
    }

    .sidebar-button:hover {
      color: ${colors.neutral.white};
      background-color: rgb(255 255 255 / 8%);
    }

    .sidebar-link:focus-visible,
    .sidebar-button:focus-visible {
      outline: 2px solid ${colors.border.focus};
      outline-offset: 2px;
    }

    .sidebar-item {
    }

    .sidebar-item-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;

      width: 1.25rem;
      height: 1.25rem;
      flex-shrink: 0;
    }

    .sidebar-item-icon svg {
      width: 1.125rem;
      height: 1.125rem;
    }

    .sidebar-item-label {
      min-width: 0;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .sidebar-item-badge {
      flex-shrink: 0;
    }

    .sidebar-footer {
      padding: ${spacing.s};
      border-top: 1px solid rgb(255 255 255 / 10%);
    }
  `}
`;

export default StyledSidebar;

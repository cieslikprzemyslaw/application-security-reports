import { css, styled } from 'styled-components';

const StyledSidebar = styled.nav.attrs({ className: 'sidebar' })`
  ${({ theme: { colors, shadows } }) => css`
    position: relative;
    display: flex;
    flex-direction: column;

    width: 100%;
    height: 100%;
    min-height: 100vh;
    overflow: hidden;

    color: ${colors.text.inverse};
    background:
      radial-gradient(
        circle at 15% -5%,
        rgb(76 111 232 / 32%),
        transparent 18rem
      ),
      linear-gradient(
        180deg,
        ${colors.surface.inverse},
        ${colors.neutral.black}
      );
    box-shadow: ${shadows.lg};
  `}

  &::after {
    content: '';

    position: absolute;
    inset: 0 0 auto;
    height: 0.1875rem;

    background: linear-gradient(
      90deg,
      ${({ theme }) => theme.colors.brand.primary},
      ${({ theme }) => theme.colors.brand.accent}
    );
    pointer-events: none;
  }

  ${({
    theme: { colors, layoutSizes, mq, radii, spacing, transitions, typography },
  }) => css`
    .sidebar-brand {
      display: flex;
      align-items: stretch;
      justify-content: space-between;
      gap: ${spacing.s};

      min-height: ${layoutSizes.topbarHeight};
      padding: ${spacing.s};

      border-bottom: 1px solid rgb(255 255 255 / 9%);
      background: rgb(255 255 255 / 2%);
    }

    .sidebar-brand-content,
    .sidebar-brand-stack {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .sidebar-brand-content {
      flex: 1 1 auto;
      justify-content: center;
      gap: ${spacing.xxs};
    }

    .sidebar-brand-stack {
      gap: ${spacing.xxs};
      width: 100%;
    }

    .sidebar-company-switcher {
      display: inline-flex;
      align-items: center;
      gap: ${spacing.xxs};

      width: 100%;
      padding: 0.625rem 0.75rem;

      border: 1px solid rgb(255 255 255 / 12%);
      border-radius: ${radii.lg};

      color: ${colors.neutral.white};
      background: rgb(255 255 255 / 6%);
      box-shadow: inset 0 1px 0 rgb(255 255 255 / 5%);
      text-align: left;
      text-decoration: none;
      transition:
        color ${transitions.fast},
        background-color ${transitions.fast},
        border-color ${transitions.fast},
        box-shadow ${transitions.fast};
    }

    .sidebar-company-switcher:hover,
    .sidebar-company-switcher--active {
      border-color: rgb(126 152 255 / 46%);
      background-color: rgb(76 111 232 / 18%);
      box-shadow:
        inset 0 1px 0 rgb(255 255 255 / 7%),
        0 0 0 1px rgb(33 198 216 / 8%);
    }

    .sidebar-company-switcher:focus-visible,
    .sidebar-link:focus-visible,
    .sidebar-button:focus-visible,
    .sidebar-close-button:focus-visible {
      outline: 2px solid ${colors.brand.accent};
      outline-offset: 2px;
    }

    .sidebar-company-switcher-icon,
    .sidebar-item-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      width: 1.25rem;
      height: 1.25rem;
    }

    .sidebar-company-switcher-icon svg {
      width: 1rem;
      height: 1rem;
    }

    .sidebar-company-switcher-text {
      display: flex;
      flex: 1;
      flex-direction: column;
      min-width: 0;
    }

    .sidebar-company-switcher-label,
    .sidebar-group-label {
      font-size: ${typography.label.small.size};
      line-height: ${typography.label.small.lineHeight};
      font-weight: ${typography.fontWeights.semibold};
      color: ${colors.text.inverse};
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .sidebar-company-switcher-name,
    .sidebar-item-label {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .sidebar-brand-title {
      font-size: ${typography.body.large.size};
      line-height: ${typography.body.large.lineHeight};
      font-weight: ${typography.fontWeights.semibold};
      letter-spacing: -0.01em;
    }

    .sidebar-brand-actions {
      display: inline-flex;

      @media ${mq.min.laptop} {
        display: none;
      }
    }

    .sidebar-close-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;

      width: 2.5rem;
      height: 2.5rem;
      padding: 0;

      border: 1px solid rgb(255 255 255 / 12%);
      border-radius: ${radii.md};

      color: ${colors.neutral.white};
      background-color: rgb(255 255 255 / 6%);
    }

    .sidebar-close-button svg {
      width: 1.125rem;
      height: 1.125rem;
    }

    .sidebar-close-button:hover {
      background-color: rgb(255 255 255 / 11%);
    }

    .sidebar-body {
      flex: 1;
      overflow-y: auto;
      padding: ${spacing.s};
      scrollbar-color: ${colors.neutral.grey400} transparent;
    }

    .sidebar-group + .sidebar-group {
      margin-top: ${spacing.m};
    }

    .sidebar-group-label {
      margin: 0 0 ${spacing.xxs};
      padding: 0 ${spacing.xxs};
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
      position: relative;

      display: flex;
      align-items: center;
      gap: ${spacing.xxs};

      width: 100%;
      min-height: 2.625rem;
      padding: 0.5625rem 0.75rem;

      border: 1px solid transparent;
      border-radius: ${radii.md};

      color: ${colors.text.inverse};
      background-color: transparent;
      text-align: left;
      text-decoration: none;
      transition:
        color ${transitions.fast},
        background-color ${transitions.fast},
        border-color ${transitions.fast},
        transform ${transitions.fast};
    }

    .sidebar-link:hover,
    .sidebar-button:hover {
      color: ${colors.neutral.white};
      border-color: rgb(255 255 255 / 7%);
      background-color: rgb(255 255 255 / 6%);
      transform: translateX(0.125rem);
    }

    .sidebar-link--active,
    .sidebar-button--active {
      color: ${colors.neutral.white};
      border-color: rgb(126 152 255 / 22%);
      background: linear-gradient(
        90deg,
        rgb(76 111 232 / 25%),
        rgb(33 198 216 / 7%)
      );
      box-shadow: inset 0 1px 0 rgb(255 255 255 / 4%);
    }

    .sidebar-link--active::before,
    .sidebar-button--active::before {
      content: '';

      position: absolute;
      inset: 0.5rem auto 0.5rem 0.25rem;

      width: 0.1875rem;
      border-radius: ${radii.pill};

      background: linear-gradient(
        180deg,
        ${colors.brand.accent},
        ${colors.brand.primary}
      );
      box-shadow: 0 0 0.75rem rgb(33 198 216 / 28%);
    }

    .sidebar-item-icon svg {
      width: 1.125rem;
      height: 1.125rem;
    }

    .sidebar-item-label {
      flex: 1;
    }

    .sidebar-item-badge {
      flex-shrink: 0;
    }

    .sidebar-footer {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xxs};

      padding: ${spacing.s};
      border-top: 1px solid rgb(255 255 255 / 9%);

      color: ${colors.text.inverse};
      background: rgb(0 0 0 / 8%);
      font-size: ${typography.body.small.size};
      line-height: ${typography.body.small.lineHeight};
    }
  `}
`;

export default StyledSidebar;

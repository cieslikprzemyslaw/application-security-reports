import { styled, css } from 'styled-components';

const StyledTopbar = styled.header.attrs({ className: 'topbar' })`
  ${({ theme: { colors, layoutSizes, mq, radii, spacing } }) => css`
    display: flex;
    align-items: center;
    gap: ${spacing.s};

    min-height: ${layoutSizes.topbarHeight};
    padding: 0 ${spacing.s};

    border-bottom: 1px solid ${colors.border.subtle};
    background-color: ${colors.surface.card};

    @media ${mq.min.tablet} {
      padding: 0 ${spacing.m};
    }

    .topbar-menu {
      display: inline-flex;

      @media ${mq.min.laptop} {
        display: none;
      }
    }

    .topbar-menu button {
      display: inline-flex;
      align-items: center;
      justify-content: center;

      width: 2.5rem;
      height: 2.5rem;
      padding: 0;

      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.md};

      color: ${colors.text.secondary};
      background-color: ${colors.surface.card};
    }

    .topbar-menu button svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    .topbar-menu button:hover {
      color: ${colors.text.primary};
      background-color: ${colors.surface.subtle};
    }

    .topbar-title {
      display: none;
      color: ${colors.text.primary};

      @media ${mq.min.tablet} {
        display: block;
      }
    }

    .topbar-search {
      flex: 1;
      min-width: 0;
      max-width: 30rem;
    }

    .topbar-spacer {
      flex: 1;
    }

    .topbar-actions {
      display: flex;
      align-items: center;
      gap: ${spacing.xxs};
    }

    .topbar-user-menu {
      display: flex;
      align-items: center;
      margin-left: ${spacing.xxxs};
    }
  `}
`;

export default StyledTopbar;

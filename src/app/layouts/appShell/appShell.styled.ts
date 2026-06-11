import { styled, css } from 'styled-components';

const StyledAppShell = styled.div.attrs({ className: 'app-shell' })`
  ${({ theme: { colors, layoutSizes, mq, transitions, zIndices } }) => css`
    min-height: 100vh;
    background-color: ${colors.surface.page};

    .app-shell-sidebar {
      position: fixed;
      inset: 0 auto 0 0;
      z-index: ${zIndices.drawer};

      width: ${layoutSizes.sidebarWidth};

      transform: translateX(-100%);
      transition: transform ${transitions.base};

      @media ${mq.min.laptop} {
        transform: translateX(0);
      }
    }

    .app-shell-sidebar[data-is-open='true'] {
      transform: translateX(0);
    }

    .app-shell-overlay {
      position: fixed;
      inset: 0;
      z-index: ${zIndices.overlay};

      display: none;
      padding: 0;
      border: 0;

      background-color: rgb(16 24 40 / 45%);
    }

    .app-shell-overlay--open {
      display: block;
    }

    @media ${mq.min.laptop} {
      .app-shell-overlay {
        display: none;
      }
    }

    .app-shell-main {
      min-width: 0;
      min-height: 100vh;

      @media ${mq.min.laptop} {
        margin-left: ${layoutSizes.sidebarWidth};
      }
    }

    .app-shell-content {
      min-width: 0;
    }

    @media print {
      .app-shell-sidebar,
      .app-shell-topbar,
      .app-shell-overlay {
        display: none !important;
      }

      .app-shell-main {
        margin-left: 0 !important;
        min-height: auto;
      }

      .app-shell-content {
        min-height: auto;
      }

      .app-shell-content > .page-content {
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
      }
    }
  `}
`;

export default StyledAppShell;

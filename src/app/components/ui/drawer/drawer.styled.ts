import styled, { css } from 'styled-components';

import type { DrawerSize } from './drawer.type';

const getDrawerWidth = (size: DrawerSize) => {
  const widths = {
    small: '24rem',
    medium: '30rem',
    large: '40rem',
  } as const;

  return widths[size];
};

const StyledDrawer = styled.div`
  ${({
    theme: { colors, radii, shadows, spacing, typography, zIndices },
  }) => css`
    .drawer-overlay {
      position: fixed;
      inset: 0;
      z-index: ${zIndices.drawer};

      background-color: rgb(16 24 40 / 45%);
    }

    .drawer-panel {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;

      display: flex;
      flex-direction: column;

      width: min(100%, var(--drawer-width));

      background-color: ${colors.surface.card};
      box-shadow: ${shadows.lg};
    }

    .drawer-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: ${spacing.s};

      padding: ${spacing.m};

      border-bottom: 1px solid ${colors.border.subtle};
    }

    .drawer-title-group {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xxxs};
    }

    .drawer-title {
      font-size: ${typography.headings.h4.size};
      line-height: ${typography.headings.h4.lineHeight};
    }

    .drawer-description {
      color: ${colors.text.muted};
    }

    .drawer-close-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;

      width: 2rem;
      height: 2rem;
      padding: 0;

      border: 0;
      border-radius: ${radii.md};

      color: ${colors.text.secondary};
      background: transparent;
    }

    .drawer-close-button:hover {
      color: ${colors.text.primary};
      background-color: ${colors.surface.subtle};
    }

    .drawer-close-button svg {
      width: 1rem;
      height: 1rem;
    }

    .drawer-body {
      flex: 1;
      overflow-y: auto;

      padding: ${spacing.m};
    }

    .drawer-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: ${spacing.xxs};

      padding: ${spacing.s} ${spacing.m};

      border-top: 1px solid ${colors.border.subtle};
    }
  `}
`;

export default StyledDrawer;

export { getDrawerWidth };

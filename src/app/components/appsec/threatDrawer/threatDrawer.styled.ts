import styled, { css } from 'styled-components';

const StyledThreatDrawer = styled.aside.attrs({ className: 'threat-drawer' })<{
  $isOpen: boolean;
}>`
  ${({
    theme: {
      colors,
      radii,
      shadows,
      spacing,
      transitions,
      typography,
      zIndices,
    },
  }) => css<{ $isOpen: boolean }>`
    position: fixed;
    inset: 0 0 0 auto;
    z-index: ${zIndices.drawer};

    width: min(100%, 32rem);
    overflow-y: auto;

    transform: translateX(${({ $isOpen }) => ($isOpen ? '0' : '100%')});
    transition: transform ${transitions.base};

    background-color: ${colors.surface.card};
    box-shadow: ${shadows.lg};

    .threat-drawer-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: ${spacing.s};

      padding: ${spacing.m};
      border-bottom: 1px solid ${colors.border.subtle};
    }

    .threat-drawer-body {
      display: flex;
      flex-direction: column;
      gap: ${spacing.m};

      padding: ${spacing.m};
    }

    .threat-drawer-title {
      font-size: ${typography.headings.h5.size};
    }

    .threat-drawer-meta {
      display: flex;
      flex-wrap: wrap;
      gap: ${spacing.xxs};
    }

    .threat-drawer-section {
      padding-top: ${spacing.s};
      border-top: 1px solid ${colors.border.subtle};
    }

    .threat-drawer-section-title {
      margin-bottom: ${spacing.xxs};
      font-size: ${typography.headings.h6.size};
    }

    .threat-drawer-close-button {
      padding: 0.375rem;

      border: 0;
      border-radius: ${radii.md};
      color: ${colors.text.secondary};
      background: transparent;
    }
  `}
`;

export default StyledThreatDrawer;

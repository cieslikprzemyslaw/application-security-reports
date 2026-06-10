import { styled, css } from 'styled-components';

import type { ModalSize } from './modal.type';

const getModalWidth = (size: ModalSize) => {
  const widths = {
    small: '26rem',
    medium: '36rem',
    large: '52rem',
  } as const;

  return widths[size];
};

const StyledModal = styled.div`
  ${({
    theme: { colors, radii, shadows, spacing, typography, zIndices },
  }) => css`
    .modal-overlay {
      position: fixed;
      inset: 0;
      z-index: ${zIndices.modal};

      display: grid;
      place-items: center;

      padding: ${spacing.m};

      background-color: rgb(16 24 40 / 55%);
    }

    .modal-dialog {
      max-height: calc(100vh - 3rem);
      overflow: auto;

      border-radius: ${radii.lg};
      background-color: ${colors.surface.card};
      box-shadow: ${shadows.lg};
    }

    .modal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: ${spacing.s};

      padding: ${spacing.m};

      border-bottom: 1px solid ${colors.border.subtle};
    }

    .modal-title-group {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xxxs};
    }

    .modal-title {
      font-size: ${typography.headings.h4.size};
      line-height: ${typography.headings.h4.lineHeight};
    }

    .modal-description {
      color: ${colors.text.muted};
    }

    .modal-close-button {
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

    .modal-close-button:hover {
      color: ${colors.text.primary};
      background-color: ${colors.surface.subtle};
    }

    .modal-close-button svg {
      width: 1rem;
      height: 1rem;
    }

    .modal-body {
      padding: ${spacing.m};
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: ${spacing.xxs};

      padding: ${spacing.s} ${spacing.m};

      border-top: 1px solid ${colors.border.subtle};
    }
  `}
`;

export default StyledModal;

export { getModalWidth };

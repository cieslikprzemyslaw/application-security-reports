import styled, { css } from 'styled-components';

import type { TooltipBubbleStyledProps } from './tooltip.type';

const StyledTooltip = styled.span.attrs({
  className: 'tooltip',
})`
  ${({ theme: { colors, radii, shadows, transitions, zIndices } }) => css`
    position: relative;
    display: inline-flex;

    &:hover .tooltip__bubble,
    &:focus-within .tooltip__bubble {
      visibility: visible;
      opacity: 1;
    }

    .tooltip__bubble {
      position: absolute;
      z-index: ${zIndices.dropdown};

      visibility: hidden;
      opacity: 0;

      width: max-content;
      max-width: 16rem;
      padding: 0.375rem 0.5rem;

      border-radius: ${radii.sm};

      font-size: 0.75rem;
      line-height: 1rem;

      color: ${colors.text.inverse};
      background-color: ${colors.surface.inverse};
      box-shadow: ${shadows.sm};

      pointer-events: none;

      transition:
        opacity ${transitions.fast},
        visibility ${transitions.fast};
    }

    .tooltip__bubble--right {
      top: 50%;
      left: calc(100% + 0.5rem);

      transform: translateY(-50%);
    }

    .tooltip__bubble--bottom {
      top: calc(100% + 0.5rem);
      left: 50%;

      transform: translateX(-50%);
    }

    .tooltip__bubble--left {
      top: 50%;
      right: calc(100% + 0.5rem);

      transform: translateY(-50%);
    }

    .tooltip__bubble--top {
      bottom: calc(100% + 0.5rem);
      left: 50%;

      transform: translateX(-50%);
    }
  `}
`;

export default StyledTooltip;

export type { TooltipBubbleStyledProps };

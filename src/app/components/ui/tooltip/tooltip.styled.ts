import styled, { css } from 'styled-components';

import type { TooltipBubbleStyledProps } from './tooltip.type';

export const TooltipWrapper = styled.span.attrs({
  className: 'tooltip-wrapper',
})`
  position: relative;
  display: inline-flex;

  &:hover > [role='tooltip'],
  &:focus-within > [role='tooltip'] {
    visibility: visible;
    opacity: 1;
  }
`;

export const TooltipBubble = styled.span.attrs({
  className: 'tooltip-bubble',
})<TooltipBubbleStyledProps>`
  position: absolute;
  z-index: ${({ theme }) => theme.zIndices.dropdown};

  visibility: hidden;
  opacity: 0;

  width: max-content;
  max-width: 16rem;
  padding: 0.375rem 0.5rem;

  border-radius: ${({ theme }) => theme.radii.sm};

  font-size: 0.75rem;
  line-height: 1rem;

  color: ${({ theme }) => theme.colors.text.inverse};

  background-color: ${({ theme }) => theme.colors.surface.inverse};

  box-shadow: ${({ theme }) => theme.shadows.sm};

  pointer-events: none;

  transition:
    opacity ${({ theme }) => theme.transitions.fast},
    visibility ${({ theme }) => theme.transitions.fast};

  ${({ $position }) => {
    switch ($position) {
      case 'right':
        return css`
          top: 50%;
          left: calc(100% + 0.5rem);

          transform: translateY(-50%);
        `;

      case 'bottom':
        return css`
          top: calc(100% + 0.5rem);
          left: 50%;

          transform: translateX(-50%);
        `;

      case 'left':
        return css`
          top: 50%;
          right: calc(100% + 0.5rem);

          transform: translateY(-50%);
        `;

      case 'top':
      default:
        return css`
          bottom: calc(100% + 0.5rem);
          left: 50%;

          transform: translateX(-50%);
        `;
    }
  }}
`;

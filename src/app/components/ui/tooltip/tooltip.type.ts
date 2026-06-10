import type { ReactElement, ReactNode } from 'react';

export type TooltipPosition = 'top' | 'right' | 'bottom' | 'left';

export interface TooltipProps {
  content: ReactNode;
  children: ReactElement;
  position?: TooltipPosition;
}

export interface TooltipBubbleStyledProps {
  $position: TooltipPosition;
}

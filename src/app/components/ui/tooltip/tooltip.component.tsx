import React, { cloneElement, useId } from 'react';

import { TooltipBubble, TooltipWrapper } from './tooltip.styled';
import type { TooltipProps } from './tooltip.type';

const Tooltip = ({ content, children, position = 'top' }: TooltipProps) => {
  const tooltipId = useId();

  return (
    <TooltipWrapper>
      {cloneElement(children, {
        'aria-describedby': tooltipId,
      })}

      <TooltipBubble id={tooltipId} role="tooltip" $position={position}>
        {content}
      </TooltipBubble>
    </TooltipWrapper>
  );
};

export default Tooltip;

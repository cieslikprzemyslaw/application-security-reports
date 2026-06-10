import React, { cloneElement, useId } from 'react';

import StyledTooltip from './tooltip.styled';
import type { TooltipProps } from './tooltip.type';

const Tooltip = ({ content, children, position = 'top' }: TooltipProps) => {
  const tooltipId = useId();

  return (
    <StyledTooltip>
      {cloneElement(children, {
        'aria-describedby': tooltipId,
      })}

      <span
        id={tooltipId}
        role="tooltip"
        className={`tooltip__bubble tooltip__bubble--${position}`}
      >
        {content}
      </span>
    </StyledTooltip>
  );
};

export default Tooltip;

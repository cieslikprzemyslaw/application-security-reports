import React from 'react';

import StyledDivider from './divider.styled';
import type { DividerProps } from './divider.type';

const Divider = ({
  orientation = 'horizontal',
  decorative = true,
  ...rest
}: DividerProps) => (
  <StyledDivider
    role={decorative ? 'presentation' : 'separator'}
    aria-orientation={decorative ? undefined : orientation}
    $orientation={orientation}
    {...rest}
  />
);

export default Divider;

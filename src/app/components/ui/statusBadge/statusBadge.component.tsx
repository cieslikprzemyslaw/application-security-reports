import React from 'react';

import StyledStatusBadge from './statusBadge.styled';
import type { StatusBadgeProps } from './statusBadge.type';

const StatusBadge = ({
  status,
  size = 'medium',
  ...rest
}: StatusBadgeProps) => (
  <StyledStatusBadge $status={status} $size={size} {...rest}>
    {status}
  </StyledStatusBadge>
);

export default StatusBadge;

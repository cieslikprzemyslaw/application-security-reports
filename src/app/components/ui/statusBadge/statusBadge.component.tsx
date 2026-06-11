import React from 'react';
import { type ThreatStatus } from '~/domain';

import StyledStatusBadge from './statusBadge.styled';
import type { StatusBadgeProps } from './statusBadge.type';

const statusLabelMap: Record<ThreatStatus, string> = {
  open: 'Open',
  'in-review': 'In Review',
  mitigated: 'Mitigated',
  'accepted-risk': 'Accepted Risk',
  'false-positive': 'False Positive',
};

const StatusBadge = ({
  status,
  size = 'medium',
  ...rest
}: StatusBadgeProps) => (
  <StyledStatusBadge $status={status} $size={size} {...rest}>
    {statusLabelMap[status]}
  </StyledStatusBadge>
);

export default StatusBadge;

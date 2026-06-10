import React from 'react';

import StyledBadge, { BadgeDot } from './badge.styled';
import type { BadgeProps } from './badge.type';

const Badge = ({
  label,
  icon,
  variant = 'neutral',
  size = 'medium',
  showDot = false,
  ...rest
}: BadgeProps) => {
  if (!label) {
    return null;
  }

  return (
    <StyledBadge $variant={variant} $size={size} {...rest}>
      {showDot && <BadgeDot aria-hidden="true" />}

      {icon}

      <span>{label}</span>
    </StyledBadge>
  );
};

export default Badge;

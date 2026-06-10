import React from 'react';

import StyledIconButton from './iconButton.styled';
import type { IconButtonProps } from './iconButton.type';

const IconButton = ({
  icon,
  ariaLabel,
  variant = 'tertiary',
  size = 'medium',
  isSelected = false,
  isLoading = false,
  disabled = false,
  type = 'button',
  ...rest
}: IconButtonProps) => (
  <StyledIconButton
    type={type}
    aria-label={ariaLabel}
    aria-busy={isLoading}
    disabled={disabled || isLoading}
    $variant={variant}
    $size={size}
    $isSelected={isSelected}
    $isLoading={isLoading}
    {...rest}
  >
    {isLoading ? (
      <span className="icon-button-spinner" aria-hidden="true" />
    ) : (
      icon
    )}
  </StyledIconButton>
);

export default IconButton;

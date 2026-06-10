import React from 'react';

import StyledButton from './button.styled';
import type { ButtonProps } from './button.type';

const Button = ({
  title,
  icon,
  iconPosition = 'left',
  ariaLabel,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  isSelected = false,
  fullWidth = false,
  disabled = false,
  type = 'button',
  ...rest
}: ButtonProps) => {
  const isIconOnly = !title && Boolean(icon);

  if (!title && !icon) {
    return null;
  }

  if (isIconOnly && !ariaLabel) {
    return null;
  }

  const isDisabled = disabled || isLoading;

  return (
    <StyledButton
      type={type}
      aria-label={ariaLabel}
      aria-busy={isLoading}
      disabled={isDisabled}
      $variant={variant}
      $size={size}
      $isIconOnly={isIconOnly}
      $iconPosition={iconPosition}
      $isLoading={isLoading}
      $isSelected={isSelected}
      $fullWidth={fullWidth}
      {...rest}
    >
      {isLoading ? (
        <span className="button-loading-spinner" aria-hidden="true" />
      ) : (
        icon
      )}

      {title && <span className="button-label">{title}</span>}
    </StyledButton>
  );
};

export default Button;

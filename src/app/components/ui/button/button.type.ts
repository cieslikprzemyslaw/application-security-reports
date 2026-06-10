import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'destructive';

export type ButtonSize = 'small' | 'medium' | 'large';

export type ButtonIconPosition = 'left' | 'right';

export interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  title?: string;
  icon?: ReactNode;
  iconPosition?: ButtonIconPosition;
  ariaLabel?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isSelected?: boolean;
  fullWidth?: boolean;
}

export interface ButtonStyledProps {
  $variant: ButtonVariant;
  $size: ButtonSize;
  $isIconOnly: boolean;
  $iconPosition: ButtonIconPosition;
  $isLoading: boolean;
  $isSelected: boolean;
  $fullWidth: boolean;
}

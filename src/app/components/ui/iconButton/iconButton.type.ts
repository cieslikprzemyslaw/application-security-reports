import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type IconButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'destructive';

export type IconButtonSize = 'small' | 'medium' | 'large';

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  icon: ReactNode;
  ariaLabel: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  isSelected?: boolean;
  isLoading?: boolean;
}

export interface IconButtonStyledProps {
  $variant: IconButtonVariant;
  $size: IconButtonSize;
  $isSelected: boolean;
  $isLoading: boolean;
}

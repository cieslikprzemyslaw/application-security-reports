import type { InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size'
> {
  label: string;
  description?: string;
  error?: string;
  hideLabel?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  inputSize?: 'small' | 'medium' | 'large';
}

export interface InputWrapperStyledProps {
  $hasError: boolean;
  $isDisabled: boolean;
}

export interface StyledInputProps {
  $inputSize: 'small' | 'medium' | 'large';
  $hasLeadingIcon: boolean;
  $hasTrailingIcon: boolean;
}

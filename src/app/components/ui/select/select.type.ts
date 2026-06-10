import type { SelectHTMLAttributes } from 'react';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  description?: string;
  error?: string;
  hideLabel?: boolean;
  placeholder?: string;
}

export interface SelectWrapperStyledProps {
  $hasError: boolean;
  $isDisabled: boolean;
}

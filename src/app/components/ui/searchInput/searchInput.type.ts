import type { InputHTMLAttributes } from 'react';

export interface SearchInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  label?: string;
  clearLabel?: string;
  onClear?: () => void;
}

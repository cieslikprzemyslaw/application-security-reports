import type { InputHTMLAttributes } from 'react';

export interface DropzoneProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'onChange'
> {
  label: string;
  description?: string;
  error?: string;
  acceptedTypes?: string;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
}

export interface DropzoneStyledProps {
  $isDragging: boolean;
  $hasError: boolean;
  $isDisabled: boolean;
}

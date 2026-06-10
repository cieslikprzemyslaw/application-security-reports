import type { TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  description?: string;
  error?: string;
  hideLabel?: boolean;
  resize?: 'none' | 'vertical' | 'both';
}

export interface StyledTextareaProps {
  $hasError: boolean;
  $resize: 'none' | 'vertical' | 'both';
}

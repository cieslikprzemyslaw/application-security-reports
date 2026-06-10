import React, { useId } from 'react';

import {
  StyledTextarea,
  TextareaDescription,
  TextareaError,
  TextareaField,
  TextareaLabel,
} from './textarea.styled';
import type { TextareaProps } from './textarea.type';

const Textarea = ({
  id,
  label,
  description,
  error,
  hideLabel = false,
  resize = 'vertical',
  required = false,
  ...rest
}: TextareaProps) => {
  const generatedId = useId();
  const textareaId = id ?? generatedId;

  const descriptionId = description ? `${textareaId}-description` : undefined;

  const errorId = error ? `${textareaId}-error` : undefined;

  const describedBy =
    [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <TextareaField>
      <TextareaLabel
        htmlFor={textareaId}
        className={hideLabel ? 'visually-hidden' : undefined}
      >
        {label}
        {required && ' *'}
      </TextareaLabel>

      {description && (
        <TextareaDescription id={descriptionId}>
          {description}
        </TextareaDescription>
      )}

      <StyledTextarea
        id={textareaId}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        $hasError={Boolean(error)}
        $resize={resize}
        {...rest}
      />

      {error && <TextareaError id={errorId}>{error}</TextareaError>}
    </TextareaField>
  );
};

export default Textarea;

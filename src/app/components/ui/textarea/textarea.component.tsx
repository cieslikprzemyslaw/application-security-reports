import React, { useId } from 'react';

import StyledTextarea from './textarea.styled';
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
    <StyledTextarea>
      <label
        className={
          hideLabel ? 'textarea-label visually-hidden' : 'textarea-label'
        }
        htmlFor={textareaId}
      >
        {label}
        {required && ' *'}
      </label>

      {description && (
        <p className="textarea-description" id={descriptionId}>
          {description}
        </p>
      )}

      <textarea
        className={[
          'textarea-control',
          error ? 'textarea-control--has-error' : '',
          resize === 'none' ? 'textarea-control--resize-none' : '',
          resize === 'both' ? 'textarea-control--resize-both' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        id={textareaId}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...rest}
      />

      {error && (
        <p className="textarea-error" id={errorId}>
          {error}
        </p>
      )}
    </StyledTextarea>
  );
};

export default Textarea;

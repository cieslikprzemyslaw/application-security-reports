import React, { useId } from 'react';

import StyledInput from './input.styled';
import type { InputProps } from './input.type';

const Input = ({
  id,
  label,
  description,
  error,
  hideLabel = false,
  leadingIcon,
  trailingIcon,
  inputSize = 'medium',
  disabled = false,
  required = false,
  ...rest
}: InputProps) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  const describedBy =
    [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <StyledInput>
      <label
        className={hideLabel ? 'input-label visually-hidden' : 'input-label'}
        htmlFor={inputId}
      >
        {label}
        {required && ' *'}
      </label>

      {description && (
        <p className="input-description" id={descriptionId}>
          {description}
        </p>
      )}

      <div
        className={[
          'input-wrapper',
          error ? 'input-wrapper--has-error' : '',
          disabled ? 'input-wrapper--disabled' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {leadingIcon && (
          <span className="input-icon input-icon--leading" aria-hidden="true">
            {leadingIcon}
          </span>
        )}

        <input
          className={[
            'input',
            `input--${inputSize}`,
            leadingIcon ? 'input--with-leading-icon' : '',
            trailingIcon ? 'input--with-trailing-icon' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          id={inputId}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...rest}
        />

        {trailingIcon && (
          <span className="input-icon input-icon--trailing" aria-hidden="true">
            {trailingIcon}
          </span>
        )}
      </div>

      {error && (
        <p className="input-error" id={errorId}>
          {error}
        </p>
      )}
    </StyledInput>
  );
};

export default Input;

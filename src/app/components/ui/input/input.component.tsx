import React, { useId } from 'react';

import {
  InputDescription,
  InputError,
  InputField,
  InputIcon,
  InputLabel,
  InputWrapper,
  StyledInput,
} from './input.styled';
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
    <InputField>
      <InputLabel
        htmlFor={inputId}
        className={hideLabel ? 'visually-hidden' : undefined}
      >
        {label}
        {required && ' *'}
      </InputLabel>

      {description && (
        <InputDescription id={descriptionId}>{description}</InputDescription>
      )}

      <InputWrapper $hasError={Boolean(error)} $isDisabled={disabled}>
        {leadingIcon && (
          <InputIcon $position="leading" aria-hidden="true">
            {leadingIcon}
          </InputIcon>
        )}

        <StyledInput
          id={inputId}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          $inputSize={inputSize}
          $hasLeadingIcon={Boolean(leadingIcon)}
          $hasTrailingIcon={Boolean(trailingIcon)}
          {...rest}
        />

        {trailingIcon && (
          <InputIcon $position="trailing" aria-hidden="true">
            {trailingIcon}
          </InputIcon>
        )}
      </InputWrapper>

      {error && <InputError id={errorId}>{error}</InputError>}
    </InputField>
  );
};

export default Input;

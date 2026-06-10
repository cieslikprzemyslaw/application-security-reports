import React, { useId } from 'react';

import {
  SelectChevron,
  SelectDescription,
  SelectError,
  SelectField,
  SelectLabel,
  SelectWrapper,
  StyledSelect,
} from './select.styled';
import type { SelectProps } from './select.type';

const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <path
      d="m7 10 5 5 5-5"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Select = ({
  id,
  label,
  options,
  description,
  error,
  hideLabel = false,
  placeholder,
  disabled = false,
  required = false,
  ...rest
}: SelectProps) => {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  const descriptionId = description ? `${selectId}-description` : undefined;

  const errorId = error ? `${selectId}-error` : undefined;

  const describedBy =
    [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <SelectField>
      <SelectLabel
        htmlFor={selectId}
        className={hideLabel ? 'visually-hidden' : undefined}
      >
        {label}
        {required && ' *'}
      </SelectLabel>

      {description && (
        <SelectDescription id={descriptionId}>{description}</SelectDescription>
      )}

      <SelectWrapper $hasError={Boolean(error)} $isDisabled={disabled}>
        <StyledSelect
          id={selectId}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}

          {options.map(option => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </StyledSelect>

        <SelectChevron>
          <ChevronIcon />
        </SelectChevron>
      </SelectWrapper>

      {error && <SelectError id={errorId}>{error}</SelectError>}
    </SelectField>
  );
};

export default Select;

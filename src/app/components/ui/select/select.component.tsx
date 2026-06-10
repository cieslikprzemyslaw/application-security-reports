import React, { useId } from 'react';

import StyledSelect from './select.styled';
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
    <StyledSelect>
      <label
        className={hideLabel ? 'select-label visually-hidden' : 'select-label'}
        htmlFor={selectId}
      >
        {label}
        {required && ' *'}
      </label>

      {description && (
        <p className="select-description" id={descriptionId}>
          {description}
        </p>
      )}

      <div
        className={[
          'select-wrapper',
          error ? 'select-wrapper--has-error' : '',
          disabled ? 'select-wrapper--disabled' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <select
          className="select-control"
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
        </select>

        <span className="select-chevron" aria-hidden="true">
          <ChevronIcon />
        </span>
      </div>

      {error && (
        <p className="select-error" id={errorId}>
          {error}
        </p>
      )}
    </StyledSelect>
  );
};

export default Select;

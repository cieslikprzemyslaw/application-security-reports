import React, { useEffect, useId, useRef } from 'react';

import StyledCheckbox from './checkbox.styled';
import type { CheckboxProps } from './checkbox.type';

const CheckIcon = ({ indeterminate }: { indeterminate: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    {indeterminate ? (
      <path d="M6 12h12" strokeWidth="2.5" strokeLinecap="round" />
    ) : (
      <path
        d="m6 12 4 4 8-8"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )}
  </svg>
);

const Checkbox = ({
  id,
  label,
  description,
  error,
  indeterminate = false,
  labelAddon,
  disabled = false,
  ...rest
}: CheckboxProps) => {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <StyledCheckbox>
      <label className="checkbox-label" htmlFor={checkboxId}>
        <input
          ref={inputRef}
          className="checkbox-input"
          id={checkboxId}
          type="checkbox"
          disabled={disabled}
          data-indeterminate={indeterminate}
          aria-invalid={Boolean(error)}
          {...rest}
        />

        <span className="checkbox-control" aria-hidden="true">
          <CheckIcon indeterminate={indeterminate} />
        </span>

        <span className="checkbox-content">
          <span className="checkbox-text">
            {label}
            {labelAddon}
          </span>

          {description && (
            <span className="checkbox-description">{description}</span>
          )}
        </span>
      </label>

      {error && <p className="checkbox-error">{error}</p>}
    </StyledCheckbox>
  );
};

export default Checkbox;

import React, { useEffect, useId, useRef } from 'react';

import {
  CheckboxContent,
  CheckboxControl,
  CheckboxDescription,
  CheckboxError,
  CheckboxField,
  CheckboxInput,
  CheckboxLabel,
  CheckboxText,
} from './checkbox.styled';
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
    <CheckboxField>
      <CheckboxLabel htmlFor={checkboxId}>
        <CheckboxInput
          ref={inputRef}
          id={checkboxId}
          type="checkbox"
          disabled={disabled}
          data-indeterminate={indeterminate}
          aria-invalid={Boolean(error)}
          {...rest}
        />

        <CheckboxControl aria-hidden="true">
          <CheckIcon indeterminate={indeterminate} />
        </CheckboxControl>

        <CheckboxContent>
          <CheckboxText>
            {label}
            {labelAddon}
          </CheckboxText>

          {description && (
            <CheckboxDescription>{description}</CheckboxDescription>
          )}
        </CheckboxContent>
      </CheckboxLabel>

      {error && <CheckboxError>{error}</CheckboxError>}
    </CheckboxField>
  );
};

export default Checkbox;

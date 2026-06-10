import React from 'react';

import StyledSearchInput from './searchInput.styled';
import type { SearchInputProps } from './searchInput.type';

const SearchSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <circle cx="11" cy="11" r="7" strokeWidth="2" />
    <path d="m20 20-4-4" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const CloseSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <path d="M6 6 18 18M18 6 6 18" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const SearchInput = ({
  label = 'Search',
  clearLabel = 'Clear search',
  onClear,
  value,
  defaultValue,
  ...rest
}: SearchInputProps) => {
  const hasValue =
    typeof value === 'string'
      ? value.length > 0
      : typeof defaultValue === 'string'
        ? defaultValue.length > 0
        : false;

  return (
    <StyledSearchInput className="search-input-wrapper">
      <span className="search-input-search-icon">
        <SearchSvg />
      </span>

      <input
        className="search-input"
        type="search"
        aria-label={label}
        value={value}
        defaultValue={defaultValue}
        {...rest}
      />

      {hasValue && onClear && (
        <button
          className="search-input-clear-button"
          type="button"
          aria-label={clearLabel}
          onClick={onClear}
        >
          <CloseSvg />
        </button>
      )}
    </StyledSearchInput>
  );
};

export default SearchInput;

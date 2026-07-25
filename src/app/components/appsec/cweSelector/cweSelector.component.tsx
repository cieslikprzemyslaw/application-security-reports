import { useId, useMemo, useState } from 'react';

import {
  getCweCatalogEntry,
  searchCweCatalog,
  type CweCatalogEntry,
} from '~/domain';

import StyledCweSelector from './cweSelector.styled';
import type { CweSelectorProps } from './cweSelector.type';

const MAX_CWE_MAPPINGS = 5;

const CweIdentity = ({ entry }: { entry: CweCatalogEntry }) => (
  <span className="cwe-selector__identity">
    <strong>
      {entry.id} - {entry.name}
    </strong>
    <span>
      {entry.status}
      {entry.deprecated && entry.replacementIds.length > 0
        ? ` · consider ${entry.replacementIds.join(', ')}`
        : ''}
    </span>
  </span>
);

const CweSelector = ({
  value,
  catalogVersion,
  error,
  disabled = false,
  onChange,
}: CweSelectorProps) => {
  const listboxId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const [query, setQuery] = useState('');
  const selectedEntries = useMemo(
    () =>
      value.map(
        id =>
          getCweCatalogEntry(id, catalogVersion) ?? {
            id,
            name: 'Unavailable in this catalog',
            status: 'Incomplete' as const,
            deprecated: false,
            replacementIds: [],
          },
      ),
    [catalogVersion, value],
  );
  const results = useMemo(
    () =>
      searchCweCatalog(query, catalogVersion, { limit: 20 }).filter(
        entry => !value.includes(entry.id),
      ),
    [catalogVersion, query, value],
  );
  const isOpen = query.trim().length > 0 && !disabled;
  const atLimit = value.length >= MAX_CWE_MAPPINGS;

  const selectEntry = (entry: CweCatalogEntry) => {
    if (atLimit || entry.deprecated) return;
    onChange([...value, entry.id]);
    setQuery('');
  };

  const moveEntry = (index: number, offset: -1 | 1) => {
    const target = index + offset;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next);
  };

  return (
    <StyledCweSelector>
      <label className="cwe-selector__label" htmlFor="threat-cwe-search">
        CWE mappings
      </label>
      <p id={descriptionId} className="cwe-selector__description">
        Add up to five ordered mappings. The first mapping is the Primary CWE.
      </p>
      <input
        id="threat-cwe-search"
        className="cwe-selector__input"
        type="search"
        role="combobox"
        autoComplete="off"
        placeholder={
          atLimit ? 'Maximum of five mappings reached' : 'Search CWE ID or name'
        }
        value={query}
        disabled={disabled || atLimit}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-describedby={`${descriptionId}${error ? ` ${errorId}` : ''}`}
        aria-invalid={Boolean(error)}
        onChange={event => setQuery(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Escape') setQuery('');
          if (event.key === 'Enter' && results[0]) {
            event.preventDefault();
            selectEntry(results[0]);
          }
        }}
      />

      {isOpen && (
        <ul id={listboxId} className="cwe-selector__results" role="listbox">
          {results.length > 0 ? (
            results.map(entry => (
              <li key={entry.id} role="presentation">
                <button
                  className="cwe-selector__option"
                  type="button"
                  role="option"
                  aria-selected="false"
                  onClick={() => selectEntry(entry)}
                >
                  <CweIdentity entry={entry} />
                </button>
              </li>
            ))
          ) : (
            <li className="cwe-selector__empty">No matching CWE entries.</li>
          )}
        </ul>
      )}

      {selectedEntries.length > 0 && (
        <ol
          className="cwe-selector__selected"
          aria-label="Selected CWE mappings"
        >
          {selectedEntries.map((entry, index) => (
            <li
              key={`${entry.id}-${index}`}
              className="cwe-selector__selected-item"
            >
              <span className="cwe-selector__role">
                {index === 0 ? 'Primary' : `Additional ${index}`}
              </span>
              <CweIdentity entry={entry} />
              <span className="cwe-selector__actions">
                <button
                  className="cwe-selector__action"
                  type="button"
                  disabled={disabled || index === 0}
                  aria-label={`Move ${entry.id} up`}
                  onClick={() => moveEntry(index, -1)}
                >
                  Up
                </button>
                <button
                  className="cwe-selector__action"
                  type="button"
                  disabled={disabled || index === value.length - 1}
                  aria-label={`Move ${entry.id} down`}
                  onClick={() => moveEntry(index, 1)}
                >
                  Down
                </button>
                <button
                  className="cwe-selector__action"
                  type="button"
                  disabled={disabled}
                  aria-label={`Remove ${entry.id}`}
                  onClick={() =>
                    onChange(
                      value.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                >
                  Remove
                </button>
              </span>
            </li>
          ))}
        </ol>
      )}

      {error && (
        <p id={errorId} className="cwe-selector__error" role="alert">
          {error}
        </p>
      )}
    </StyledCweSelector>
  );
};

export default CweSelector;

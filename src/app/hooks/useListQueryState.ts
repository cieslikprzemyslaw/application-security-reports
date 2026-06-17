import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export const listSearchDebounceMs = 250;

type PrimitiveListValue = string | number;
type ListStateShape<TState> = {
  [K in keyof TState]: PrimitiveListValue;
};

export interface ListQueryField<TState extends ListStateShape<TState>> {
  key: keyof TState;
  param: string;
  defaultValue: PrimitiveListValue;
  parse: (value: string | null) => PrimitiveListValue;
  serialize?: (value: PrimitiveListValue) => string;
}

export interface UseListQueryStateResult<
  TState extends ListStateShape<TState>,
> {
  state: TState;
  searchValue: string;
  setSearchValue: (value: string) => void;
  setControl: (
    next: Partial<TState>,
    options?: { resetPage?: boolean },
  ) => void;
  clearControls: () => void;
}

const valuesEqual = (left: PrimitiveListValue, right: PrimitiveListValue) =>
  String(left) === String(right);

const parseListQueryState = <TState extends ListStateShape<TState>>(
  searchParams: URLSearchParams,
  fields: ReadonlyArray<ListQueryField<TState>>,
): TState =>
  fields.reduce<Record<string, PrimitiveListValue>>((state, field) => {
    state[String(field.key)] = field.parse(searchParams.get(field.param));

    return state;
  }, {}) as TState;

const serializeListQueryState = <TState extends ListStateShape<TState>>(
  baseParams: URLSearchParams,
  state: TState,
  fields: ReadonlyArray<ListQueryField<TState>>,
) => {
  const nextParams = new URLSearchParams(baseParams);

  for (const field of fields) {
    nextParams.delete(field.param);
  }

  for (const field of fields) {
    const value = state[field.key];

    if (valuesEqual(value, field.defaultValue)) {
      continue;
    }

    nextParams.set(
      field.param,
      field.serialize ? field.serialize(value) : String(value),
    );
  }

  return nextParams;
};

export const useListQueryState = <TState extends ListStateShape<TState>>({
  fields,
  pageKey,
  searchKey,
}: {
  fields: ReadonlyArray<ListQueryField<TState>>;
  pageKey?: keyof TState;
  searchKey: keyof TState;
}): UseListQueryStateResult<TState> => {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo(
    () => parseListQueryState(searchParams, fields),
    [fields, searchParams],
  );
  const stateSearchValue = String(state[searchKey]);
  const [searchDraft, setSearchDraft] = useState({
    committed: stateSearchValue,
    value: stateSearchValue,
  });

  if (searchDraft.committed !== stateSearchValue) {
    setSearchDraft({
      committed: stateSearchValue,
      value: stateSearchValue,
    });
  }

  const searchValue =
    searchDraft.committed === stateSearchValue
      ? searchDraft.value
      : stateSearchValue;
  const setSearchValue = useCallback((value: string) => {
    setSearchDraft(current => ({
      ...current,
      value,
    }));
  }, []);

  useEffect(() => {
    const normalizedParams = serializeListQueryState(
      searchParams,
      state,
      fields,
    );

    if (normalizedParams.toString() !== searchParams.toString()) {
      setSearchParams(normalizedParams, { replace: true });
    }
  }, [fields, searchParams, setSearchParams, state]);

  const setControl = useCallback(
    (next: Partial<TState>, options: { resetPage?: boolean } = {}) => {
      const shouldResetPage = options.resetPage ?? true;
      const nextState = {
        ...state,
        ...next,
        ...(shouldResetPage && pageKey ? { [pageKey]: 1 } : {}),
      } as TState;

      setSearchParams(serializeListQueryState(searchParams, nextState, fields));
    },
    [fields, pageKey, searchParams, setSearchParams, state],
  );

  const clearControls = useCallback(() => {
    const nextState = fields.reduce<Partial<TState>>((next, field) => {
      next[field.key] = field.defaultValue as TState[keyof TState];

      return next;
    }, {}) as TState;

    setSearchDraft({
      committed: String(nextState[searchKey]),
      value: String(nextState[searchKey]),
    });
    setSearchParams(serializeListQueryState(searchParams, nextState, fields));
  }, [fields, searchKey, searchParams, setSearchParams]);

  useEffect(() => {
    if (searchValue === String(state[searchKey])) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setControl({ [searchKey]: searchValue } as Partial<TState>);
    }, listSearchDebounceMs);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [searchKey, searchValue, setControl, state]);

  return {
    state,
    searchValue,
    setSearchValue,
    setControl,
    clearControls,
  };
};

import React from 'react';

import {
  FilterToolbarActions,
  FilterToolbarMain,
  FilterToolbarSearch,
  FilterToolbarSummary,
  StyledFilterToolbar,
} from './filterToolbar.styled';
import type { FilterToolbarProps } from './filterToolbar.type';

const FilterToolbar = ({
  filters,
  search,
  actions,
  summary,
  ...rest
}: FilterToolbarProps) => (
  <StyledFilterToolbar {...rest}>
    <FilterToolbarMain>
      {search && <FilterToolbarSearch>{search}</FilterToolbarSearch>}

      {filters}
    </FilterToolbarMain>

    {summary && <FilterToolbarSummary>{summary}</FilterToolbarSummary>}

    {actions && <FilterToolbarActions>{actions}</FilterToolbarActions>}
  </StyledFilterToolbar>
);

export default FilterToolbar;

import React from 'react';

import StyledFilterToolbar from './filterToolbar.styled';
import type { FilterToolbarProps } from './filterToolbar.type';

const FilterToolbar = ({
  filters,
  search,
  actions,
  summary,
  ...rest
}: FilterToolbarProps) => (
  <StyledFilterToolbar className="filter-toolbar" {...rest}>
    <div className="filter-toolbar-main">
      {search && <div className="filter-toolbar-search">{search}</div>}

      {filters}
    </div>

    {summary && <div className="filter-toolbar-summary">{summary}</div>}

    {actions && <div className="filter-toolbar-actions">{actions}</div>}
  </StyledFilterToolbar>
);

export default FilterToolbar;

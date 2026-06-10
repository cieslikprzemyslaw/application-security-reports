import React from 'react';

import {
  StyledTableFooter,
  TableFooterActions,
  TableFooterSpacer,
  TableFooterSummary,
} from './tableFooter.styled';
import type { TableFooterProps } from './tableFooter.type';

const TableFooter = ({
  summary,
  pagination,
  actions,
  ...rest
}: TableFooterProps) => (
  <StyledTableFooter {...rest}>
    {summary && <TableFooterSummary>{summary}</TableFooterSummary>}

    <TableFooterSpacer />

    {actions && <TableFooterActions>{actions}</TableFooterActions>}

    {pagination}
  </StyledTableFooter>
);

export default TableFooter;

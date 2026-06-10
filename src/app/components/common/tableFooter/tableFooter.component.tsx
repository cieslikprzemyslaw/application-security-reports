import React from 'react';

import StyledTableFooter from './tableFooter.styled';
import type { TableFooterProps } from './tableFooter.type';

const TableFooter = ({
  summary,
  pagination,
  actions,
  ...rest
}: TableFooterProps) => (
  <StyledTableFooter className="table-footer" {...rest}>
    {summary && <div className="table-footer-summary">{summary}</div>}

    <div className="table-footer-spacer" />

    {actions && <div className="table-footer-actions">{actions}</div>}

    {pagination}
  </StyledTableFooter>
);

export default TableFooter;

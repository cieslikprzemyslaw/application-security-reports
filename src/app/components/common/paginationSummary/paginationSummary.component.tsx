import React from 'react';

import StyledPaginationSummary from './paginationSummary.styled';
import type { PaginationSummaryProps } from './paginationSummary.type';

const PaginationSummary = ({
  currentPage,
  pageSize,
  totalItems,
  itemLabel = 'items',
  ...rest
}: PaginationSummaryProps) => {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;

  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <StyledPaginationSummary {...rest}>
      Showing {start}–{end} of {totalItems} {itemLabel}
    </StyledPaginationSummary>
  );
};

export default PaginationSummary;

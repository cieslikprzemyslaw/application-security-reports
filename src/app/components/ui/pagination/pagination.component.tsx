import React from 'react';

import StyledPagination from './pagination.styled';
import type { PaginationProps } from './pagination.type';

const ChevronLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <path
      d="m15 6-6 6 6 6"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <path
      d="m9 6 6 6-6 6"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const createPageRange = (
  currentPage: number,
  totalPages: number,
  siblingCount: number,
): Array<number | 'ellipsis'> => {
  if (totalPages <= siblingCount * 2 + 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const startPage = Math.max(2, currentPage - siblingCount);

  const endPage = Math.min(totalPages - 1, currentPage + siblingCount);

  const pages: Array<number | 'ellipsis'> = [1];

  if (startPage > 2) {
    pages.push('ellipsis');
  }

  for (let page = startPage; page <= endPage; page += 1) {
    pages.push(page);
  }

  if (endPage < totalPages - 1) {
    pages.push('ellipsis');
  }

  pages.push(totalPages);

  return pages;
};

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  ariaLabel = 'Pagination',
}: PaginationProps) => {
  if (totalPages <= 1) {
    return null;
  }

  const pageRange = createPageRange(currentPage, totalPages, siblingCount);

  return (
    <StyledPagination aria-label={ariaLabel} className="pagination-nav">
      <button
        className="pagination-button"
        type="button"
        aria-label="Previous page"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft />
      </button>

      {pageRange.map((item, index) =>
        item === 'ellipsis' ? (
          <span
            key={`ellipsis-${index}`}
            className="pagination-ellipsis"
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <button
            key={item}
            className={[
              'pagination-button',
              item === currentPage
                ? 'pagination-button--active'
                : 'pagination-button--inactive',
            ].join(' ')}
            type="button"
            aria-label={`Page ${item}`}
            aria-current={item === currentPage ? 'page' : undefined}
            onClick={() => onPageChange(item)}
          >
            {item}
          </button>
        ),
      )}

      <button
        className="pagination-button"
        type="button"
        aria-label="Next page"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRight />
      </button>
    </StyledPagination>
  );
};

export default Pagination;

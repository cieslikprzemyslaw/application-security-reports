import type { HTMLAttributes } from 'react';

export interface PaginationSummaryProps extends HTMLAttributes<HTMLParagraphElement> {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  itemLabel?: string;
}

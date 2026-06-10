import type { Key, ReactNode } from 'react';

export interface DataTableColumn<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => Key;
  caption?: string;
  emptyState?: ReactNode;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  loadingRows?: number;
}

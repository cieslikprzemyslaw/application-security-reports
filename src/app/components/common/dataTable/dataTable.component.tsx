import React from 'react';

import {
  DataTableBody,
  DataTableCell,
  DataTableEmptyCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  DataTableSkeleton,
  DataTableWrapper,
  StyledDataTable,
} from './dataTable.styled';
import type { DataTableProps } from './dataTable.type';

const DataTable = <T,>({
  columns,
  rows,
  getRowKey,
  caption,
  emptyState,
  onRowClick,
  isLoading = false,
  loadingRows = 5,
}: DataTableProps<T>) => {
  const loadingItems = Array.from({
    length: loadingRows,
  });

  return (
    <DataTableWrapper>
      <StyledDataTable>
        {caption && <caption className="visually-hidden">{caption}</caption>}

        <DataTableHead>
          <tr>
            {columns.map(column => (
              <DataTableHeaderCell
                key={column.id}
                scope="col"
                $width={column.width}
                $align={column.align ?? 'left'}
              >
                {column.header}
              </DataTableHeaderCell>
            ))}
          </tr>
        </DataTableHead>

        <DataTableBody>
          {isLoading &&
            loadingItems.map((_, rowIndex) => (
              <DataTableRow key={`loading-${rowIndex}`} $isClickable={false}>
                {columns.map(column => (
                  <DataTableCell
                    key={column.id}
                    $align={column.align ?? 'left'}
                  >
                    <DataTableSkeleton />
                  </DataTableCell>
                ))}
              </DataTableRow>
            ))}

          {!isLoading &&
            rows.map(row => (
              <DataTableRow
                key={getRowKey(row)}
                $isClickable={Boolean(onRowClick)}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={() => onRowClick?.(row)}
                onKeyDown={event => {
                  if (
                    onRowClick &&
                    (event.key === 'Enter' || event.key === ' ')
                  ) {
                    event.preventDefault();
                    onRowClick(row);
                  }
                }}
              >
                {columns.map(column => (
                  <DataTableCell
                    key={column.id}
                    $align={column.align ?? 'left'}
                  >
                    {column.cell(row)}
                  </DataTableCell>
                ))}
              </DataTableRow>
            ))}

          {!isLoading && rows.length === 0 && (
            <tr>
              <DataTableEmptyCell colSpan={columns.length}>
                {emptyState ?? 'No data available.'}
              </DataTableEmptyCell>
            </tr>
          )}
        </DataTableBody>
      </StyledDataTable>
    </DataTableWrapper>
  );
};

export default DataTable;

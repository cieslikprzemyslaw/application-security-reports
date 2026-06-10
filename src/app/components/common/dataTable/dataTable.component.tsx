import React from 'react';

import StyledDataTable from './dataTable.styled';
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
    <StyledDataTable>
      <table className="data-table">
        {caption && <caption className="visually-hidden">{caption}</caption>}

        <thead className="data-table-head">
          <tr>
            {columns.map(column => (
              <th
                key={column.id}
                scope="col"
                className={[
                  'data-table-header-cell',
                  column.align ? `data-table-header-cell--${column.align}` : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ width: column.width ?? 'auto' }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="data-table-body">
          {isLoading &&
            loadingItems.map((_, rowIndex) => (
              <tr key={`loading-${rowIndex}`} className="data-table-row">
                {columns.map(column => (
                  <td
                    key={column.id}
                    className={[
                      'data-table-cell',
                      column.align ? `data-table-cell--${column.align}` : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <div className="data-table-skeleton" />
                  </td>
                ))}
              </tr>
            ))}

          {!isLoading &&
            rows.map(row => (
              <tr
                key={getRowKey(row)}
                className={[
                  'data-table-row',
                  onRowClick ? 'data-table-row--clickable' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
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
                  <td
                    key={column.id}
                    className={[
                      'data-table-cell',
                      column.align ? `data-table-cell--${column.align}` : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}

          {!isLoading && rows.length === 0 && (
            <tr>
              <td className="data-table-empty-cell" colSpan={columns.length}>
                {emptyState ?? 'No data available.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </StyledDataTable>
  );
};

export default DataTable;

import styled from 'styled-components';

export const DataTableWrapper = styled.div.attrs({
  className: 'data-table-wrapper',
})`
  width: 100%;
  overflow-x: auto;
`;

export const StyledDataTable = styled.table.attrs({ className: 'data-table' })`
  width: 100%;
  border-collapse: collapse;
`;

export const DataTableHead = styled.thead.attrs({
  className: 'data-table-head',
})`
  background-color: ${({ theme }) => theme.colors.neutral.grey50};
`;

export const DataTableHeaderCell = styled.th.attrs({
  className: 'data-table-header-cell',
})<{
  $align: 'left' | 'center' | 'right';
  $width?: string;
}>`
  width: ${({ $width }) => $width ?? 'auto'};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.s};

  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};

  font-size: ${({ theme }) => theme.typography.label.small.size};

  line-height: ${({ theme }) => theme.typography.label.small.lineHeight};

  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};

  color: ${({ theme }) => theme.colors.text.muted};

  text-align: ${({ $align }) => $align};
  white-space: nowrap;
`;

export const DataTableBody = styled.tbody.attrs({
  className: 'data-table-body',
})``;

export const DataTableRow = styled.tr.attrs({ className: 'data-table-row' })<{
  $isClickable: boolean;
}>`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};

  cursor: ${({ $isClickable }) => ($isClickable ? 'pointer' : 'default')};

  &:hover {
    background-color: ${({ theme, $isClickable }) =>
      $isClickable ? theme.colors.neutral.grey50 : 'transparent'};
  }

  &:last-child {
    border-bottom: 0;
  }
`;

export const DataTableCell = styled.td.attrs({ className: 'data-table-cell' })<{
  $align: 'left' | 'center' | 'right';
}>`
  padding: ${({ theme }) => theme.spacing.s};

  color: ${({ theme }) => theme.colors.text.secondary};

  text-align: ${({ $align }) => $align};
  vertical-align: middle;
`;

export const DataTableEmptyCell = styled.td.attrs({
  className: 'data-table-empty-cell',
})`
  padding: ${({ theme }) => theme.spacing.xxl} ${({ theme }) => theme.spacing.m};
`;

export const DataTableSkeleton = styled.div.attrs({
  className: 'data-table-skeleton',
})`
  width: 100%;
  height: 1rem;

  border-radius: ${({ theme }) => theme.radii.sm};

  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.neutral.grey100},
    ${({ theme }) => theme.colors.neutral.grey200},
    ${({ theme }) => theme.colors.neutral.grey100}
  );

  background-size: 200% 100%;

  animation: data-table-loading 1.4s ease infinite;

  @keyframes data-table-loading {
    from {
      background-position: 200% 0;
    }

    to {
      background-position: -200% 0;
    }
  }
`;

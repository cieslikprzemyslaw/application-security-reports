import styled from 'styled-components';

const StyledGlobalThreatTable = styled.div.attrs({
  className: 'global-threat-table',
})`
  width: 100%;
  overflow-x: auto;
`;

export const Table = styled.table.attrs({
  className: 'global-threat-table-table',
})`
  width: 100%;
  border-collapse: collapse;
`;

export const Head = styled.thead.attrs({
  className: 'global-threat-table-head',
})`
  background-color: ${({ theme }) => theme.colors.neutral.grey50};
`;

export const HeaderCell = styled.th.attrs({
  className: 'global-threat-table-header-cell',
})`
  padding: 0.75rem ${({ theme }) => theme.spacing.s};

  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};

  font-size: ${({ theme }) => theme.typography.label.small.size};

  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};

  color: ${({ theme }) => theme.colors.text.muted};

  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
`;

export const Row = styled.tr.attrs({ className: 'global-threat-table-row' })<{
  $clickable: boolean;
}>`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};

  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};

  &:last-child {
    border-bottom: 0;
  }

  &:hover {
    background-color: ${({ theme, $clickable }) =>
      $clickable ? theme.colors.neutral.grey50 : 'transparent'};
  }
`;

export const Cell = styled.td.attrs({ className: 'global-threat-table-cell' })`
  padding: 0.625rem ${({ theme }) => theme.spacing.s};

  color: ${({ theme }) => theme.colors.text.secondary};

  vertical-align: middle;
`;

export const ThreatTitle = styled.strong.attrs({
  className: 'global-threat-table-threat-title',
})`
  display: block;

  color: ${({ theme }) => theme.colors.text.primary};
`;

export const ThreatId = styled.span.attrs({
  className: 'global-threat-table-threat-id',
})`
  display: block;
  margin-top: 0.125rem;

  font-family: ${({ theme }) => theme.typography.fontFamilies.mono};

  font-size: ${({ theme }) => theme.typography.body.small.size};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const AppName = styled.strong.attrs({
  className: 'global-threat-table-app-name',
})`
  display: block;

  color: ${({ theme }) => theme.colors.text.primary};
`;

export const CompanyName = styled.span.attrs({
  className: 'global-threat-table-company-name',
})`
  display: block;
  margin-top: 0.125rem;

  font-size: ${({ theme }) => theme.typography.body.small.size};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const Stride = styled.span.attrs({
  className: 'global-threat-table-stride',
})`
  display: inline-flex;
  align-items: center;

  padding: 0.125rem 0.5rem;

  border-radius: ${({ theme }) => theme.radii.pill};

  font-size: ${({ theme }) => theme.typography.body.small.size};

  background-color: ${({ theme }) => theme.colors.neutral.grey100};
`;

export const Chevron = styled.span.attrs({
  className: 'global-threat-table-chevron',
})`
  color: ${({ theme }) => theme.colors.neutral.grey400};

  font-size: 1.25rem;
`;

export default StyledGlobalThreatTable;

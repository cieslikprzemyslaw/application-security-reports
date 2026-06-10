import styled from 'styled-components';

export const ReportNameCell = styled.div.attrs({
  className: 'report-table-report-name-cell',
})`
  min-width: 14rem;
`;

export const ReportName = styled.strong.attrs({
  className: 'report-table-report-name',
})`
  display: block;

  color: ${({ theme }) => theme.colors.text.primary};
`;

export const ReportCompany = styled.span.attrs({
  className: 'report-table-report-company',
})`
  display: block;
  margin-top: 0.125rem;

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const ReportDate = styled.time.attrs({
  className: 'report-table-report-date',
})`
  white-space: nowrap;

  color: ${({ theme }) => theme.colors.text.muted};
`;

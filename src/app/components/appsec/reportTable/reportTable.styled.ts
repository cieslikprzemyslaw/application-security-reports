import styled, { css } from 'styled-components';

const StyledReportTable = styled.div`
  ${({ theme: { colors } }) => css`
    .report-table-report-name-cell {
      min-width: 14rem;
    }

    .report-table-report-name {
      display: block;
      color: ${colors.text.primary};
    }

    .report-table-report-company {
      display: block;
      margin-top: 0.125rem;
      color: ${colors.text.muted};
    }

    .report-table-report-date {
      white-space: nowrap;
      color: ${colors.text.muted};
    }
  `}
`;

export default StyledReportTable;

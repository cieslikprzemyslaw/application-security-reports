import styled from 'styled-components';

export const StyledTableFooter = styled.div.attrs({
  className: 'table-footer',
})`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s};

  padding: ${({ theme }) => theme.spacing.s};

  border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};

  @media ${({ theme }) => theme.mq.min.tablet} {
    flex-direction: row;
    align-items: center;
  }
`;

export const TableFooterSummary = styled.div.attrs({
  className: 'table-footer-summary',
})`
  color: ${({ theme }) => theme.colors.text.muted};
`;

export const TableFooterSpacer = styled.div.attrs({
  className: 'table-footer-spacer',
})`
  flex: 1;
`;

export const TableFooterActions = styled.div.attrs({
  className: 'table-footer-actions',
})`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxs};
`;

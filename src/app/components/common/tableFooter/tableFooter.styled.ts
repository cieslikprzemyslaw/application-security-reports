import { styled, css } from 'styled-components';

const StyledTableFooter = styled.div`
  ${({ theme: { colors, mq, spacing } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.s};

    padding: ${spacing.s};

    border-top: 1px solid ${colors.border.subtle};

    @media ${mq.min.tablet} {
      flex-direction: row;
      align-items: center;
    }

    .table-footer-summary {
      color: ${colors.text.muted};
    }

    .table-footer-spacer {
      flex: 1;
    }

    .table-footer-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: ${spacing.xxs};
    }
  `}
`;

export default StyledTableFooter;

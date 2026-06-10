import styled, { css } from 'styled-components';

const StyledFilterToolbar = styled.div`
  ${({ theme: { colors, mq, spacing, typography } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.s};

    padding: ${spacing.s};

    border-bottom: 1px solid ${colors.border.subtle};

    @media ${mq.min.tablet} {
      flex-direction: row;
      align-items: center;
    }

    .filter-toolbar-main {
      display: flex;
      flex: 1;
      flex-wrap: wrap;
      align-items: center;
      gap: ${spacing.xxs};
    }

    .filter-toolbar-search {
      width: 100%;

      @media ${mq.min.tablet} {
        width: min(18rem, 100%);
      }
    }

    .filter-toolbar-summary {
      margin-left: auto;

      font-size: ${typography.body.small.size};
      color: ${colors.text.muted};
    }

    .filter-toolbar-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: ${spacing.xxs};
    }
  `}
`;

export default StyledFilterToolbar;

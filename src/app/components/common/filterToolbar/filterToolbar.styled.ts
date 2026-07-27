import { css, styled } from 'styled-components';

const StyledFilterToolbar = styled.div`
  ${({ theme: { colors, mq, radii, spacing, typography } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.s};

    padding: ${spacing.s};

    border: 1px solid ${colors.border.subtle};
    border-radius: ${radii.lg};
    background: linear-gradient(
      180deg,
      ${colors.surface.card},
      ${colors.surface.subtle}
    );

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
      font-weight: ${typography.fontWeights.medium};
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

import styled, { css } from 'styled-components';

const StyledThreats = styled.div.attrs({ className: 'threats' })`
  ${({ theme: { colors, mq, radii, shadows, spacing, typography } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.l};

    .threats-header {
      display: flex;
      flex-direction: column;
      gap: ${spacing.s};

      @media ${mq.min.tablet} {
        flex-direction: row;
        align-items: flex-start;
        justify-content: space-between;
      }
    }

    .threats-title {
      font-size: ${typography.headings.h3.size};
    }

    .threats-subtitle {
      margin-top: ${spacing.xxxs};
      color: ${colors.text.muted};
    }

    .threats-header-actions {
      display: flex;
      flex-wrap: wrap;
      gap: ${spacing.xxs};
    }

    .threats-card {
      overflow: hidden;
      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.lg};
      background-color: ${colors.surface.card};
      box-shadow: ${shadows.xs};
    }

    .threats-toolbar {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xxs};
      padding: ${spacing.s};
      border-bottom: 1px solid ${colors.border.subtle};

      @media ${mq.min.tablet} {
        flex-direction: row;
        align-items: center;
      }
    }

    .threats-search-wrap {
      width: min(100%, 18rem);
    }

    .threats-filters {
      display: flex;
      flex-wrap: wrap;
      gap: ${spacing.xxs};
    }

    .threats-summary {
      margin-left: auto;
      font-size: ${typography.body.small.size};
      color: ${colors.text.muted};
    }

    .threats-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: ${spacing.s};
      border-top: 1px solid ${colors.border.subtle};
      color: ${colors.text.muted};
    }
  `}
`;

export default StyledThreats;

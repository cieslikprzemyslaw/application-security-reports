import { styled, css } from 'styled-components';

const StyledAssessments = styled.div.attrs({ className: 'assessments' })`
  ${({ theme: { colors, mq, radii, shadows, spacing, typography } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.l};

    .assessments-header {
      display: flex;
      flex-direction: column;
      gap: ${spacing.s};

      @media ${mq.min.tablet} {
        flex-direction: row;
        align-items: flex-start;
        justify-content: space-between;
      }
    }

    .assessments-header-text {
      min-width: 0;
    }

    .assessments-title {
      font-size: ${typography.headings.h3.size};
      line-height: ${typography.headings.h3.lineHeight};
    }

    .assessments-subtitle {
      margin-top: ${spacing.xxxs};
      color: ${colors.text.muted};
    }

    .assessments-header-actions {
      display: flex;
      flex-wrap: wrap;
      gap: ${spacing.xxs};
    }

    .assessments-search-wrapper {
      width: min(100%, 15rem);
    }

    .assessments-card {
      overflow: hidden;
      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.lg};
      background-color: ${colors.surface.card};
      box-shadow: ${shadows.xs};
    }

    .assessments-toolbar {
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

    .assessments-filters {
      display: flex;
      flex-wrap: wrap;
      gap: ${spacing.xxs};
    }

    .assessments-summary {
      margin-left: auto;
      font-size: ${typography.body.small.size};
      color: ${colors.text.muted};
    }

    .assessments-empty {
      padding: ${spacing.xl};
      color: ${colors.text.muted};
      text-align: center;
    }
  `}
`;

export default StyledAssessments;

import { styled, css } from 'styled-components';

const StyledAssessmentSummary = styled.section.attrs({
  className: 'assessment-summary',
})`
  ${({ theme: { colors, mq, radii, shadows, spacing, typography } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.m};

    padding: ${spacing.m};

    border: 1px solid ${colors.border.subtle};
    border-radius: ${radii.lg};
    background-color: ${colors.surface.card};
    box-shadow: ${shadows.xs};

    .assessment-summary-header {
      display: flex;
      flex-direction: column;
      gap: ${spacing.s};

      @media ${mq.min.tablet} {
        flex-direction: row;
        align-items: flex-start;
        justify-content: space-between;
      }
    }

    .assessment-summary-identity {
      display: flex;
      align-items: center;
      gap: ${spacing.s};
    }

    .assessment-summary-company-logo {
      display: inline-flex;
      align-items: center;
      justify-content: center;

      width: 3rem;
      height: 3rem;
      overflow: hidden;

      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.md};
      background-color: ${colors.surface.subtle};
    }

    .assessment-summary-title-group {
      min-width: 0;
    }

    .assessment-summary-company-name {
      color: ${colors.text.muted};
    }

    .assessment-summary-application-name {
      font-size: ${typography.headings.h4.size};
      line-height: ${typography.headings.h4.lineHeight};
    }

    .assessment-summary-badges {
      display: flex;
      flex-wrap: wrap;
      gap: ${spacing.xxs};
    }

    .assessment-summary-metadata-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
      gap: ${spacing.s};

      margin: 0;
      padding-top: ${spacing.s};

      border-top: 1px solid ${colors.border.subtle};
    }

    .assessment-summary-metadata-item {
      min-width: 0;
    }

    .assessment-summary-metadata-label {
      margin-bottom: 0.125rem;

      font-size: ${typography.body.small.size};
      color: ${colors.text.muted};
    }

    .assessment-summary-metadata-value {
      display: flex;
      align-items: center;
      gap: ${spacing.xxxs};

      margin: 0;

      font-size: ${typography.body.medium.size};
      font-weight: ${typography.fontWeights.medium};
      color: ${colors.text.primary};
    }

    .assessment-summary-metadata-value svg {
      width: 0.875rem;
      height: 0.875rem;
      color: ${colors.text.muted};
    }
  `}
`;

export default StyledAssessmentSummary;

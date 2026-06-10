import { styled, css } from 'styled-components';

const StyledAssessmentDetails = styled.div.attrs({
  className: 'assessment-details',
})`
  ${({ theme: { colors, mq, radii, spacing, typography } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.l};

    .assessment-details-header {
      display: flex;
      flex-direction: column;
      gap: ${spacing.s};

      @media ${mq.min.tablet} {
        flex-direction: row;
        align-items: flex-start;
        justify-content: space-between;
      }
    }

    .assessment-details-header-actions {
      display: flex;
      gap: ${spacing.xxs};
    }

    .assessment-details-title {
      font-size: ${typography.headings.h3.size};
    }

    .assessment-details-subtitle {
      margin-top: ${spacing.xxxs};
      color: ${colors.text.muted};
    }

    .assessment-details-summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      gap: ${spacing.s};
    }

    .assessment-details-summary-card {
      padding: ${spacing.s};
      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.md};
      background-color: ${colors.surface.card};
    }

    .assessment-details-section {
      overflow: hidden;
      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.lg};
      background-color: ${colors.surface.card};
    }

    .assessment-details-section-header {
      display: flex;
      justify-content: space-between;
      gap: ${spacing.s};
      padding: ${spacing.s} ${spacing.m};
      border-bottom: 1px solid ${colors.border.subtle};
    }

    .assessment-details-section-body {
      padding: ${spacing.m};
    }

    .assessment-details__status-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.125rem 0.5rem;
      border: 1px solid;
      border-radius: ${radii.sm};
      font-size: ${typography.body.small.size};
      font-weight: ${typography.fontWeights.medium};
    }

    .assessment-details__status-badge--Draft {
      color: ${colors.text.secondary};
      background-color: ${colors.neutral.grey100};
      border-color: ${colors.border.subtle};
    }

    .assessment-details__status-badge--In-Progress {
      color: ${colors.status.inProgress.text};
      background-color: ${colors.status.inProgress.background};
      border-color: ${colors.border.focus};
    }

    .assessment-details__status-badge--In-Review {
      color: ${colors.severity.medium.text};
      background-color: ${colors.severity.medium.background};
      border-color: ${colors.severity.medium.solid};
    }

    .assessment-details__status-badge--Completed {
      color: ${colors.status.resolved.text};
      background-color: ${colors.status.resolved.background};
      border-color: ${colors.severity.low.solid};
    }

    .assessment-details__status-badge--Retest-Required {
      color: ${colors.status.retestRequired.text};
      background-color: ${colors.status.retestRequired.background};
      border-color: ${colors.status.retestRequired.text};
    }
  `}
`;

export default StyledAssessmentDetails;

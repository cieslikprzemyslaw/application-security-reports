import styled, { css } from 'styled-components';

const StyledRiskSummary = styled.div.attrs({ className: 'risk-summary' })`
  ${({ theme: { colors, radii, spacing, typography } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.m};

    .risk-summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr));
      gap: ${spacing.xxs};
    }

    .risk-summary-metric {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xxxs};

      padding: ${spacing.s};

      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.md};
      background-color: ${colors.surface.card};
    }

    .risk-summary-metric-label {
      font-size: ${typography.body.small.size};
      line-height: ${typography.body.small.lineHeight};
      color: ${colors.text.muted};
    }

    .risk-summary-metric-value {
      font-size: ${typography.headings.h4.size};
      line-height: ${typography.headings.h4.lineHeight};
      font-weight: ${typography.headings.h4.weight};
      color: ${colors.text.primary};
    }

    .risk-summary-severity-breakdown {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xxs};
    }

    .risk-summary-severity-breakdown-row {
      display: grid;
      grid-template-columns: 7rem minmax(0, 1fr) 2rem;
      align-items: center;
      gap: ${spacing.xxs};
    }

    .risk-summary-severity-bar-track {
      height: 0.5rem;
      overflow: hidden;

      border-radius: ${radii.pill};
      background-color: ${colors.neutral.grey100};
    }

    .risk-summary-severity-bar-fill {
      height: 100%;
      border-radius: inherit;
    }

    .risk-summary-severity-bar-fill--critical {
      background-color: ${colors.severity.critical.solid};
    }

    .risk-summary-severity-bar-fill--high {
      background-color: ${colors.severity.high.solid};
    }

    .risk-summary-severity-bar-fill--medium {
      background-color: ${colors.severity.medium.solid};
    }

    .risk-summary-severity-bar-fill--low {
      background-color: ${colors.severity.low.solid};
    }

    .risk-summary-severity-bar-fill--informational {
      background-color: ${colors.severity.informational.solid};
    }

    .risk-summary-severity-count-value {
      font-size: ${typography.body.small.size};
      line-height: ${typography.body.small.lineHeight};
      font-weight: ${typography.fontWeights.semibold};
      color: ${colors.text.secondary};
      text-align: right;
    }
  `}
`;

export default StyledRiskSummary;

import styled, { css } from 'styled-components';

const StyledSeverityDistribution = styled.div.attrs({
  className: 'severity-distribution',
})`
  ${({ theme: { colors, radii, spacing, typography } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.s};

    .severity-distribution-bar {
      display: flex;
      width: 100%;
      height: 0.75rem;
      overflow: hidden;

      border-radius: ${radii.pill};
      background-color: ${colors.neutral.grey100};
    }

    .severity-distribution-segment {
      min-width: 0;
    }

    .severity-distribution-segment--critical {
      background-color: ${colors.severity.critical.solid};
    }

    .severity-distribution-segment--high {
      background-color: ${colors.severity.high.solid};
    }

    .severity-distribution-segment--medium {
      background-color: ${colors.severity.medium.solid};
    }

    .severity-distribution-segment--low {
      background-color: ${colors.severity.low.solid};
    }

    .severity-distribution-segment--informational {
      background-color: ${colors.severity.informational.solid};
    }

    .severity-distribution-segment--empty {
      min-width: 0;
    }

    .severity-distribution-legend {
      display: flex;
      flex-wrap: wrap;
      gap: ${spacing.xxs};
    }

    .severity-distribution-legend-item {
      display: inline-flex;
      align-items: center;
      gap: ${spacing.xxxs};
    }

    .severity-distribution-legend-value {
      font-weight: ${typography.fontWeights.semibold};
      color: ${colors.text.primary};
    }
  `}
`;

export default StyledSeverityDistribution;

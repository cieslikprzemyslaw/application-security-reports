import { styled, css } from 'styled-components';

import type { AssessmentStatusTone } from './assessmentStatusChart.type';

const StyledAssessmentStatusChart = styled.div<{ $background: string }>`
  ${({ theme: { colors, radii, spacing, typography }, $background }) => css`
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: ${spacing.l};

    .assessment-status-chart__donut {
      position: relative;

      display: grid;
      place-items: center;

      width: 8.5rem;
      height: 8.5rem;

      border-radius: ${radii.circle};

      background: conic-gradient(${$background});
    }

    .assessment-status-chart__donut::after {
      content: '';

      position: absolute;

      width: 5.5rem;
      height: 5.5rem;

      border-radius: ${radii.circle};

      background-color: ${colors.surface.card};
    }

    .assessment-status-chart__donut-centre {
      position: relative;
      z-index: 1;

      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .assessment-status-chart__donut-value {
      font-size: ${typography.headings.h4.size};

      line-height: ${typography.headings.h4.lineHeight};

      color: ${colors.text.primary};
    }

    .assessment-status-chart__donut-label {
      font-size: ${typography.body.small.size};

      color: ${colors.text.muted};
    }

    .assessment-status-chart__legend {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xxs};

      margin: 0;
      padding: 0;

      list-style: none;
    }

    .assessment-status-chart__legend-item {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      gap: ${spacing.xxs};
    }

    .assessment-status-chart__legend-dot {
      width: 0.5rem;
      height: 0.5rem;

      border-radius: ${radii.xs};
    }

    .assessment-status-chart__legend-dot--completed {
      background-color: ${colors.severity.low.solid};
    }

    .assessment-status-chart__legend-dot--inProgress {
      background-color: ${colors.brand.primary};
    }

    .assessment-status-chart__legend-dot--inReview {
      background-color: ${colors.severity.medium.solid};
    }

    .assessment-status-chart__legend-dot--draft {
      background-color: ${colors.neutral.grey400};
    }

    .assessment-status-chart__legend-label {
      color: ${colors.text.secondary};
    }

    .assessment-status-chart__legend-value {
      color: ${colors.text.primary};
    }
  `}
`;

export default StyledAssessmentStatusChart;

export type { AssessmentStatusTone };

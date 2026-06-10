import React from 'react';
import { useTheme } from 'styled-components';

import StyledAssessmentStatusChart from './assessmentStatusChart.styled';

import type {
  AssessmentStatusChartProps,
  AssessmentStatusTone,
} from './assessmentStatusChart.type';

const AssessmentStatusChart = ({
  items,
  centreLabel = 'assessments',
  ...rest
}: AssessmentStatusChartProps) => {
  const { colors } = useTheme();

  const total = items.reduce((sum, item) => sum + item.count, 0);

  const toneColours: Record<AssessmentStatusTone, string> = {
    completed: colors.severity.low.solid,
    inProgress: colors.brand.primary,
    inReview: colors.severity.medium.solid,
    draft: colors.neutral.grey400,
  };

  let currentPercentage = 0;

  const segments = items.map(item => {
    const start = currentPercentage;
    const percentage = total === 0 ? 0 : (item.count / total) * 100;

    currentPercentage += percentage;

    return `${toneColours[item.tone]} ${start}% ${currentPercentage}%`;
  });

  const background =
    segments.length > 0
      ? segments.join(', ')
      : `${colors.neutral.grey200} 0% 100%`;

  return (
    <StyledAssessmentStatusChart {...rest} $background={background}>
      <div
        className="assessment-status-chart__donut"
        role="img"
        aria-label={`${total} ${centreLabel}`}
      >
        <div className="assessment-status-chart__donut-centre">
          <strong className="assessment-status-chart__donut-value">
            {total}
          </strong>

          <span className="assessment-status-chart__donut-label">
            {centreLabel}
          </span>
        </div>
      </div>

      <ul className="assessment-status-chart__legend">
        {items.map(item => (
          <li key={item.label} className="assessment-status-chart__legend-item">
            <span
              className={[
                'assessment-status-chart__legend-dot',
                `assessment-status-chart__legend-dot--${item.tone}`,
              ].join(' ')}
            />

            <span className="assessment-status-chart__legend-label">
              {item.label}
            </span>

            <strong className="assessment-status-chart__legend-value">
              {item.count}
            </strong>
          </li>
        ))}
      </ul>
    </StyledAssessmentStatusChart>
  );
};

export default AssessmentStatusChart;

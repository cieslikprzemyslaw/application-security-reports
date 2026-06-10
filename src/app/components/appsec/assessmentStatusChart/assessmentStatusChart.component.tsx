import React from 'react';
import { useTheme } from 'styled-components';

import StyledAssessmentStatusChart, {
  DonutChart,
  DonutChartCentre,
  DonutChartLabel,
  DonutChartValue,
  StatusLegend,
  StatusLegendDot,
  StatusLegendItem,
  StatusLegendLabel,
  StatusLegendValue,
} from './assessmentStatusChart.styled';

import type {
  AssessmentStatusChartProps,
  AssessmentStatusTone,
} from './assessmentStatusChart.type';

const AssessmentStatusChart = ({
  items,
  centreLabel = 'assessments',
  ...rest
}: AssessmentStatusChartProps) => {
  const theme = useTheme();

  const total = items.reduce((sum, item) => sum + item.count, 0);

  const toneColours: Record<AssessmentStatusTone, string> = {
    completed: theme.colors.severity.low.solid,
    inProgress: theme.colors.brand.primary,
    inReview: theme.colors.severity.medium.solid,
    draft: theme.colors.neutral.grey400,
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
      : `${theme.colors.neutral.grey200} 0% 100%`;

  return (
    <StyledAssessmentStatusChart {...rest}>
      <DonutChart
        $background={background}
        role="img"
        aria-label={`${total} ${centreLabel}`}
      >
        <DonutChartCentre>
          <DonutChartValue>{total}</DonutChartValue>

          <DonutChartLabel>{centreLabel}</DonutChartLabel>
        </DonutChartCentre>
      </DonutChart>

      <StatusLegend>
        {items.map(item => (
          <StatusLegendItem key={item.label}>
            <StatusLegendDot $tone={item.tone} />

            <StatusLegendLabel>{item.label}</StatusLegendLabel>

            <StatusLegendValue>{item.count}</StatusLegendValue>
          </StatusLegendItem>
        ))}
      </StatusLegend>
    </StyledAssessmentStatusChart>
  );
};

export default AssessmentStatusChart;

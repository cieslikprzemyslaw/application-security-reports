import styled from 'styled-components';

const StyledAssessmentStatusChart = styled.div.attrs({
  className: 'assessment-status-chart',
})`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: ${({ theme }) => theme.spacing.l};
`;

export const DonutChart = styled.div.attrs({
  className: 'assessment-status-chart-donut-chart',
})<{
  $background: string;
}>`
  position: relative;

  display: grid;
  place-items: center;

  width: 8.5rem;
  height: 8.5rem;

  border-radius: ${({ theme }) => theme.radii.circle};

  background: conic-gradient(${({ $background }) => $background});

  &::after {
    content: '';

    position: absolute;

    width: 5.5rem;
    height: 5.5rem;

    border-radius: ${({ theme }) => theme.radii.circle};

    background-color: ${({ theme }) => theme.colors.surface.card};
  }
`;

export const DonutChartCentre = styled.div.attrs({
  className: 'assessment-status-chart-donut-chart-centre',
})`
  position: relative;
  z-index: 1;

  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const DonutChartValue = styled.strong.attrs({
  className: 'assessment-status-chart-donut-chart-value',
})`
  font-size: ${({ theme }) => theme.typography.headings.h4.size};

  line-height: ${({ theme }) => theme.typography.headings.h4.lineHeight};

  color: ${({ theme }) => theme.colors.text.primary};
`;

export const DonutChartLabel = styled.span.attrs({
  className: 'assessment-status-chart-donut-chart-label',
})`
  font-size: ${({ theme }) => theme.typography.body.small.size};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const StatusLegend = styled.ul.attrs({
  className: 'assessment-status-chart-status-legend',
})`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxs};

  margin: 0;
  padding: 0;

  list-style: none;
`;

export const StatusLegendItem = styled.li.attrs({
  className: 'assessment-status-chart-status-legend-item',
})`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxs};
`;

export const StatusLegendDot = styled.span.attrs({
  className: 'assessment-status-chart-status-legend-dot',
})<{
  $tone: AssessmentStatusTone;
}>`
  width: 0.5rem;
  height: 0.5rem;

  border-radius: ${({ theme }) => theme.radii.xs};

  background-color: ${({ theme, $tone }) => {
    const tones = {
      completed: theme.colors.severity.low.solid,
      inProgress: theme.colors.brand.primary,
      inReview: theme.colors.severity.medium.solid,
      draft: theme.colors.neutral.grey400,
    } as const;

    return tones[$tone];
  }};
`;

export const StatusLegendLabel = styled.span.attrs({
  className: 'assessment-status-chart-status-legend-label',
})`
  color: ${({ theme }) => theme.colors.text.secondary};
`;

export const StatusLegendValue = styled.strong.attrs({
  className: 'assessment-status-chart-status-legend-value',
})`
  color: ${({ theme }) => theme.colors.text.primary};
`;

export default StyledAssessmentStatusChart;

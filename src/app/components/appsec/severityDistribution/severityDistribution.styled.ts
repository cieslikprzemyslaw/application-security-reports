import styled from 'styled-components';

const StyledSeverityDistribution = styled.div.attrs({
  className: 'severity-distribution',
})`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s};
`;

export const SeverityDistributionBar = styled.div.attrs({
  className: 'severity-distribution-bar',
})`
  display: flex;
  width: 100%;
  height: 0.75rem;
  overflow: hidden;

  border-radius: ${({ theme }) => theme.radii.pill};

  background-color: ${({ theme }) => theme.colors.neutral.grey100};
`;

export const SeveritySegment = styled.div.attrs({
  className: 'severity-distribution-severity-segment',
})<{
  $severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  $width: number;
}>`
  width: ${({ $width }) => `${$width}%`};

  min-width: ${({ $width }) => ($width > 0 ? '0.25rem' : '0')};

  background-color: ${({ theme, $severity }) =>
    theme.colors.severity[$severity].solid};
`;

export const SeverityLegend = styled.div.attrs({
  className: 'severity-distribution-severity-legend',
})`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xxs};
`;

export const SeverityLegendItem = styled.div.attrs({
  className: 'severity-distribution-severity-legend-item',
})`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxxs};
`;

export const SeverityLegendValue = styled.strong.attrs({
  className: 'severity-distribution-severity-legend-value',
})`
  color: ${({ theme }) => theme.colors.text.primary};
`;

export default StyledSeverityDistribution;

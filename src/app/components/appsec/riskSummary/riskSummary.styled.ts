import styled from 'styled-components';

const StyledRiskSummary = styled.div.attrs({ className: 'risk-summary' })`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.m};
`;

export const RiskSummaryGrid = styled.div.attrs({
  className: 'risk-summary-grid',
})`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr));
  gap: ${({ theme }) => theme.spacing.xxs};
`;

export const RiskMetric = styled.div.attrs({
  className: 'risk-summary-risk-metric',
})`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxxs};

  padding: ${({ theme }) => theme.spacing.s};

  border: 1px solid ${({ theme }) => theme.colors.border.subtle};

  border-radius: ${({ theme }) => theme.radii.md};

  background-color: ${({ theme }) => theme.colors.surface.card};
`;

export const RiskMetricLabel = styled.span.attrs({
  className: 'risk-summary-risk-metric-label',
})`
  font-size: ${({ theme }) => theme.typography.body.small.size};

  line-height: ${({ theme }) => theme.typography.body.small.lineHeight};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const RiskMetricValue = styled.strong.attrs({
  className: 'risk-summary-risk-metric-value',
})`
  font-size: ${({ theme }) => theme.typography.headings.h4.size};

  line-height: ${({ theme }) => theme.typography.headings.h4.lineHeight};

  font-weight: ${({ theme }) => theme.typography.headings.h4.weight};

  color: ${({ theme }) => theme.colors.text.primary};
`;

export const SeverityBreakdown = styled.div.attrs({
  className: 'risk-summary-severity-breakdown',
})`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxs};
`;

export const SeverityBreakdownRow = styled.div.attrs({
  className: 'risk-summary-severity-breakdown-row',
})`
  display: grid;
  grid-template-columns:
    7rem
    minmax(0, 1fr)
    2rem;

  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxs};
`;

export const SeverityBarTrack = styled.div.attrs({
  className: 'risk-summary-severity-bar-track',
})`
  height: 0.5rem;
  overflow: hidden;

  border-radius: ${({ theme }) => theme.radii.pill};

  background-color: ${({ theme }) => theme.colors.neutral.grey100};
`;

export const SeverityBarFill = styled.div.attrs({
  className: 'risk-summary-severity-bar-fill',
})<{
  $severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  $width: number;
}>`
  width: ${({ $width }) => `${$width}%`};

  height: 100%;

  border-radius: inherit;

  background-color: ${({ theme, $severity }) =>
    theme.colors.severity[$severity].solid};
`;

export const SeverityCountValue = styled.span.attrs({
  className: 'risk-summary-severity-count-value',
})`
  font-size: ${({ theme }) => theme.typography.body.small.size};

  line-height: ${({ theme }) => theme.typography.body.small.lineHeight};

  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};

  color: ${({ theme }) => theme.colors.text.secondary};

  text-align: right;
`;

export default StyledRiskSummary;

import React from 'react';

import SeverityBadge from '~/app/components/ui/severityBadge';

import StyledRiskSummary, {
  RiskMetric,
  RiskMetricLabel,
  RiskMetricValue,
  RiskSummaryGrid,
  SeverityBarFill,
  SeverityBarTrack,
  SeverityBreakdown,
  SeverityBreakdownRow,
  SeverityCountValue,
} from './riskSummary.styled';

import type { RiskSummaryProps } from './riskSummary.type';

const severityKeyMap = {
  Critical: 'critical',
  High: 'high',
  Medium: 'medium',
  Low: 'low',
  Informational: 'informational',
} as const;

const RiskSummary = ({
  overallRisk,
  totalFindings,
  openThreats,
  retestRequired,
  severityCounts,
  ...rest
}: RiskSummaryProps) => {
  const highestCount = Math.max(1, ...severityCounts.map(item => item.count));

  return (
    <StyledRiskSummary {...rest}>
      <RiskSummaryGrid>
        <RiskMetric>
          <RiskMetricLabel>Overall risk</RiskMetricLabel>

          <SeverityBadge severity={overallRisk} />
        </RiskMetric>

        <RiskMetric>
          <RiskMetricLabel>Total findings</RiskMetricLabel>

          <RiskMetricValue>{totalFindings}</RiskMetricValue>
        </RiskMetric>

        <RiskMetric>
          <RiskMetricLabel>Open threats</RiskMetricLabel>

          <RiskMetricValue>{openThreats}</RiskMetricValue>
        </RiskMetric>

        <RiskMetric>
          <RiskMetricLabel>Retest required</RiskMetricLabel>

          <RiskMetricValue>{retestRequired}</RiskMetricValue>
        </RiskMetric>
      </RiskSummaryGrid>

      <SeverityBreakdown>
        {severityCounts.map(item => {
          const severityKey = severityKeyMap[item.severity];

          const width = (item.count / highestCount) * 100;

          return (
            <SeverityBreakdownRow key={item.severity}>
              <SeverityBadge severity={item.severity} size="small" />

              <SeverityBarTrack>
                <SeverityBarFill $severity={severityKey} $width={width} />
              </SeverityBarTrack>

              <SeverityCountValue>{item.count}</SeverityCountValue>
            </SeverityBreakdownRow>
          );
        })}
      </SeverityBreakdown>
    </StyledRiskSummary>
  );
};

export default RiskSummary;

import React from 'react';

import SeverityBadge from '~/app/components/ui/severityBadge';

import StyledSeverityDistribution, {
  SeverityDistributionBar,
  SeverityLegend,
  SeverityLegendItem,
  SeverityLegendValue,
  SeveritySegment,
} from './severityDistribution.styled';

import type { SeverityDistributionProps } from './severityDistribution.type';

const severityKeyMap = {
  Critical: 'critical',
  High: 'high',
  Medium: 'medium',
  Low: 'low',
  Informational: 'informational',
} as const;

const SeverityDistribution = ({
  items,
  showTotal = true,
  ...rest
}: SeverityDistributionProps) => {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <StyledSeverityDistribution {...rest}>
      <SeverityDistributionBar
        aria-label={`Severity distribution. ${total} total findings.`}
      >
        {items.map(item => (
          <SeveritySegment
            key={item.severity}
            $severity={severityKeyMap[item.severity]}
            $width={total === 0 ? 0 : (item.count / total) * 100}
          />
        ))}
      </SeverityDistributionBar>

      <SeverityLegend>
        {items.map(item => (
          <SeverityLegendItem key={item.severity}>
            <SeverityBadge severity={item.severity} size="small" showDot />

            <SeverityLegendValue>{item.count}</SeverityLegendValue>
          </SeverityLegendItem>
        ))}

        {showTotal && (
          <SeverityLegendItem>
            <span>Total</span>

            <SeverityLegendValue>{total}</SeverityLegendValue>
          </SeverityLegendItem>
        )}
      </SeverityLegend>
    </StyledSeverityDistribution>
  );
};

export default SeverityDistribution;

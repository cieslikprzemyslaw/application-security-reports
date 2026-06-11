import React from 'react';

import SeverityBadge from '~/app/components/ui/severityBadge';

import StyledSeverityDistribution from './severityDistribution.styled';

import type { SeverityDistributionProps } from './severityDistribution.type';

const severityKeyMap = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
  informational: 'informational',
} as const;

const SeverityDistribution = ({
  items,
  showTotal = true,
  ...rest
}: SeverityDistributionProps) => {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <StyledSeverityDistribution {...rest}>
      <div
        className="severity-distribution-bar"
        aria-label={`Severity distribution. ${total} total findings.`}
      >
        {items.map(item => (
          <div
            key={item.severity}
            className={[
              'severity-distribution-segment',
              `severity-distribution-segment--${severityKeyMap[item.severity]}`,
              total === 0 ? 'severity-distribution-segment--empty' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{
              width: `${total === 0 ? 0 : (item.count / total) * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="severity-distribution-legend">
        {items.map(item => (
          <div
            key={item.severity}
            className="severity-distribution-legend-item"
          >
            <SeverityBadge severity={item.severity} size="small" showDot />

            <strong className="severity-distribution-legend-value">
              {item.count}
            </strong>
          </div>
        ))}

        {showTotal && (
          <div className="severity-distribution-legend-item">
            <span>Total</span>

            <strong className="severity-distribution-legend-value">
              {total}
            </strong>
          </div>
        )}
      </div>
    </StyledSeverityDistribution>
  );
};

export default SeverityDistribution;

import React from 'react';

import SeverityBadge from '~/app/components/ui/severityBadge';

import StyledRiskSummary from './riskSummary.styled';

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
      <div className="risk-summary-grid">
        <div className="risk-summary-metric">
          <span className="risk-summary-metric-label">Overall risk</span>

          <SeverityBadge severity={overallRisk} />
        </div>

        <div className="risk-summary-metric">
          <span className="risk-summary-metric-label">Total findings</span>

          <strong className="risk-summary-metric-value">{totalFindings}</strong>
        </div>

        <div className="risk-summary-metric">
          <span className="risk-summary-metric-label">Open threats</span>

          <strong className="risk-summary-metric-value">{openThreats}</strong>
        </div>

        <div className="risk-summary-metric">
          <span className="risk-summary-metric-label">Retest required</span>

          <strong className="risk-summary-metric-value">
            {retestRequired}
          </strong>
        </div>
      </div>

      <div className="risk-summary-severity-breakdown">
        {severityCounts.map(item => {
          const severityKey = severityKeyMap[item.severity];

          const width = (item.count / highestCount) * 100;

          return (
            <div
              key={item.severity}
              className="risk-summary-severity-breakdown-row"
            >
              <SeverityBadge severity={item.severity} size="small" />

              <div className="risk-summary-severity-bar-track">
                <div
                  className={[
                    'risk-summary-severity-bar-fill',
                    `risk-summary-severity-bar-fill--${severityKey}`,
                  ].join(' ')}
                  style={{ width: `${width}%` }}
                />
              </div>

              <span className="risk-summary-severity-count-value">
                {item.count}
              </span>
            </div>
          );
        })}
      </div>
    </StyledRiskSummary>
  );
};

export default RiskSummary;

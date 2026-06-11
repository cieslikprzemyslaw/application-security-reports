import React from 'react';
import { SEVERITIES, type Severity } from '~/domain';

import StyledSeverityBadge from './severityBadge.styled';

import type { SeverityBadgeProps } from './severityBadge.type';

const severityLabelMap: Record<Severity, string> = {
  informational: 'Informational',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

const isValidSeverity = (severity: unknown): severity is Severity =>
  SEVERITIES.includes(severity as Severity);

const SeverityBadge = ({
  severity,
  size = 'medium',
  showDot = true,
  ...rest
}: SeverityBadgeProps) => {
  const safeSeverity: Severity = isValidSeverity(severity)
    ? severity
    : 'informational';

  return (
    <StyledSeverityBadge $severity={safeSeverity} $size={size} {...rest}>
      {showDot && <span className="severity-badge-severity-dot" />}

      {severityLabelMap[safeSeverity]}
    </StyledSeverityBadge>
  );
};

export default SeverityBadge;

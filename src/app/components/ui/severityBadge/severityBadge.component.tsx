import React from 'react';

import StyledSeverityBadge from './severityBadge.styled';

import type { Severity, SeverityBadgeProps } from './severityBadge.type';

const validSeverities: Severity[] = [
  'Critical',
  'High',
  'Medium',
  'Low',
  'Informational',
];

const isValidSeverity = (severity: unknown): severity is Severity =>
  validSeverities.includes(severity as Severity);

const SeverityBadge = ({
  severity,
  size = 'medium',
  showDot = true,
  ...rest
}: SeverityBadgeProps) => {
  const safeSeverity: Severity = isValidSeverity(severity)
    ? severity
    : 'Informational';

  return (
    <StyledSeverityBadge $severity={safeSeverity} $size={size} {...rest}>
      {showDot && <span className="severity-badge-severity-dot" />}

      {safeSeverity}
    </StyledSeverityBadge>
  );
};

export default SeverityBadge;

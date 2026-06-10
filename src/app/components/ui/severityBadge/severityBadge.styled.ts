import styled from 'styled-components';

import type { Severity, SeverityBadgeSize } from './severityBadge.type';

const severityKeyMap = {
  Critical: 'critical',
  High: 'high',
  Medium: 'medium',
  Low: 'low',
  Informational: 'informational',
} as const;

const StyledSeverityBadge = styled.span.attrs({ className: 'severity-badge' })<{
  $severity: Severity;
  $size: SeverityBadgeSize;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;

  width: fit-content;

  padding: ${({ $size }) =>
    $size === 'small' ? '0.125rem 0.5rem' : '0.25rem 0.625rem'};

  border: 1px solid
    ${({ theme, $severity }) => {
      const severityKey = severityKeyMap[$severity] ?? 'informational';

      return theme.colors.severity[severityKey].solid;
    }};

  border-radius: ${({ theme }) => theme.radii.sm};

  font-size: ${({ theme, $size }) =>
    $size === 'small'
      ? theme.typography.body.small.size
      : theme.typography.body.medium.size};

  line-height: ${({ theme, $size }) =>
    $size === 'small'
      ? theme.typography.body.small.lineHeight
      : theme.typography.body.medium.lineHeight};

  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};

  color: ${({ theme, $severity }) => {
    const severityKey = severityKeyMap[$severity] ?? 'informational';

    return theme.colors.severity[severityKey].text;
  }};

  background-color: ${({ theme, $severity }) => {
    const severityKey = severityKeyMap[$severity] ?? 'informational';

    return theme.colors.severity[severityKey].background;
  }};

  white-space: nowrap;
`;

export const SeverityDot = styled.span.attrs({
  className: 'severity-badge-severity-dot',
})`
  width: 0.375rem;
  height: 0.375rem;
  flex-shrink: 0;

  border-radius: ${({ theme }) => theme.radii.circle};

  background-color: currentColor;
`;

export default StyledSeverityBadge;

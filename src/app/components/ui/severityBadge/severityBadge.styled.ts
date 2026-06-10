import styled, { css } from 'styled-components';

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
  ${({ theme: { colors, radii, typography } }) => css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;

    width: fit-content;
    padding: ${({ $size }) =>
      $size === 'small' ? '0.125rem 0.5rem' : '0.25rem 0.625rem'};

    border: 1px solid
      ${({ $severity }) => {
        const severityKey = severityKeyMap[$severity] ?? 'informational';
        return colors.severity[severityKey].solid;
      }};
    border-radius: ${radii.sm};

    font-size: ${({ $size }) =>
      $size === 'small'
        ? typography.body.small.size
        : typography.body.medium.size};
    line-height: ${({ $size }) =>
      $size === 'small'
        ? typography.body.small.lineHeight
        : typography.body.medium.lineHeight};
    font-weight: ${typography.fontWeights.medium};

    color: ${({ $severity }) => {
      const severityKey = severityKeyMap[$severity] ?? 'informational';
      return colors.severity[severityKey].text;
    }};
    background-color: ${({ $severity }) => {
      const severityKey = severityKeyMap[$severity] ?? 'informational';
      return colors.severity[severityKey].background;
    }};

    white-space: nowrap;

    .severity-badge-severity-dot {
      width: 0.375rem;
      height: 0.375rem;
      flex-shrink: 0;

      border-radius: ${radii.circle};
      background-color: currentColor;
    }
  `}
`;

export default StyledSeverityBadge;

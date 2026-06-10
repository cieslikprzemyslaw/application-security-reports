import { styled, css } from 'styled-components';

import type {
  StatusBadgeSize,
  StatusBadgeStyledProps,
  ThreatStatus,
} from './statusBadge.type';

const statusKeyMap = {
  Open: 'open',
  'In Progress': 'inProgress',
  Resolved: 'resolved',
  'Retest Required': 'retestRequired',
  'Accepted Risk': 'acceptedRisk',
} as const;

const getStatusStyles = (status: ThreatStatus) => css`
  ${({ theme: { colors } }) => {
    const statusColors = colors.status[statusKeyMap[status]];

    return css`
      color: ${statusColors.text};
      background-color: ${statusColors.background};
    `;
  }}
`;

const getSizeStyles = (size: StatusBadgeSize) => {
  if (size === 'small') {
    return css`
      min-height: 1.25rem;
      padding: 0.125rem 0.5rem;

      font-size: 0.75rem;
      line-height: 1rem;
    `;
  }

  return css`
    min-height: 1.5rem;
    padding: 0.125rem 0.625rem;

    font-size: 0.875rem;
    line-height: 1.25rem;
  `;
};

const StyledStatusBadge = styled.span.attrs({
  className: 'status-badge',
})<StatusBadgeStyledProps>`
  ${({ theme: { radii, typography } }) => css<StatusBadgeStyledProps>`
    display: inline-flex;
    align-items: center;

    width: fit-content;
    border-radius: ${radii.pill};

    font-family: ${typography.fontFamilies.body};

    font-weight: ${typography.fontWeights.medium};

    white-space: nowrap;

    ${({ $status }) => getStatusStyles($status)}

    ${({ $size }) => getSizeStyles($size)}
  `}
`;

export default StyledStatusBadge;

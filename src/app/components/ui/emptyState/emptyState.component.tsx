import React from 'react';

import StyledEmptyState from './emptyState.styled';
import type { EmptyStateProps } from './emptyState.type';

const EmptyState = ({
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
  ...rest
}: EmptyStateProps) => (
  <StyledEmptyState
    className="empty-state"
    role="status"
    aria-live="polite"
    {...rest}
  >
    {icon && (
      <span className="empty-state-icon" aria-hidden="true">
        {icon}
      </span>
    )}

    <h3 className="empty-state-title">{title}</h3>

    {description && <p className="empty-state-description">{description}</p>}

    {(primaryAction || secondaryAction) && (
      <div className="empty-state-actions">
        {primaryAction}
        {secondaryAction}
      </div>
    )}
  </StyledEmptyState>
);

export default EmptyState;

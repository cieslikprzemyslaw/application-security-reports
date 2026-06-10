import React from 'react';

import StyledEmptyState, {
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from './emptyState.styled';
import type { EmptyStateProps } from './emptyState.type';

const EmptyState = ({
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
  ...rest
}: EmptyStateProps) => (
  <StyledEmptyState {...rest}>
    {icon && <EmptyStateIcon aria-hidden="true">{icon}</EmptyStateIcon>}

    <EmptyStateTitle>{title}</EmptyStateTitle>

    {description && (
      <EmptyStateDescription>{description}</EmptyStateDescription>
    )}

    {(primaryAction || secondaryAction) && (
      <EmptyStateActions>
        {primaryAction}
        {secondaryAction}
      </EmptyStateActions>
    )}
  </StyledEmptyState>
);

export default EmptyState;

import React, { useId } from 'react';

import IconSVG from '../iconSVG';
import StyledEmptyState from './emptyState.styled';
import type { EmptyStateProps, EmptyStateVariant } from './emptyState.type';

const variantMetadata: Record<
  EmptyStateVariant,
  {
    eyebrow: string;
    icon: React.ReactNode;
    role: 'region' | 'status' | 'note';
    live?: 'polite';
  }
> = {
  'first-use': {
    eyebrow: 'First use',
    icon: <IconSVG name="add" />,
    role: 'region',
  },
  'no-results': {
    eyebrow: 'No results',
    icon: <IconSVG name="search" />,
    role: 'status',
    live: 'polite',
  },
  unavailable: {
    eyebrow: 'Unavailable',
    icon: <IconSVG name="warning" />,
    role: 'note',
  },
};

const EmptyState = ({
  variant,
  eyebrow,
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
  className,
  ...rest
}: EmptyStateProps) => {
  const eyebrowId = useId();
  const titleId = useId();
  const descriptionId = useId();
  const metadata = variant ? variantMetadata[variant] : undefined;
  const resolvedEyebrow = eyebrow ?? metadata?.eyebrow;
  const resolvedIcon = icon ?? metadata?.icon;
  const role = metadata?.role ?? 'status';
  const live = metadata?.live ?? (variant ? undefined : 'polite');
  const labelledBy = [resolvedEyebrow ? eyebrowId : null, titleId]
    .filter(Boolean)
    .join(' ');
  const describedBy = description ? descriptionId : undefined;

  return (
    <StyledEmptyState className="empty-state-container">
      <div
        className={[
          'empty-state-layout',
          'empty-state',
          variant ? `empty-state--${variant}` : 'empty-state--legacy',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        data-variant={variant ?? 'legacy'}
        role={role}
        aria-live={live}
        aria-atomic={role === 'status' ? 'true' : undefined}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        {...rest}
      >
        {resolvedIcon && (
          <span className="empty-state-icon" aria-hidden="true">
            {resolvedIcon}
          </span>
        )}

        <div className="empty-state-copy">
          {resolvedEyebrow && (
            <p className="empty-state-eyebrow" id={eyebrowId}>
              {resolvedEyebrow}
            </p>
          )}

          <h3 className="empty-state-title" id={titleId}>
            {title}
          </h3>

          {description && (
            <div className="empty-state-description" id={descriptionId}>
              {description}
            </div>
          )}
        </div>

        {(primaryAction || secondaryAction) && (
          <div className="empty-state-actions">
            {primaryAction}
            {secondaryAction}
          </div>
        )}
      </div>
    </StyledEmptyState>
  );
};

export default EmptyState;

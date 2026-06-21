import React from 'react';

import Button from '../button';
import IconSVG from '../iconSVG';
import StyledCallout from './callout.styled';
import type { CalloutProps } from './callout.type';

const Callout = ({
  title,
  children,
  icon,
  actions,
  dismissLabel = 'Dismiss alert',
  onDismiss,
  variant = 'info',
  ...rest
}: CalloutProps) => {
  const {
    className,
    ['aria-live']: ariaLive,
    ...calloutProps
  } = rest as typeof rest & {
    className?: string;
    'aria-live'?: 'off' | 'polite' | 'assertive';
  };

  const liveRegion = ariaLive ?? (variant === 'error' ? 'assertive' : 'polite');

  return (
    <StyledCallout
      {...calloutProps}
      className={[`callout callout--${variant}`, className]
        .filter(Boolean)
        .join(' ')}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={liveRegion}
      aria-atomic="true"
    >
      {icon && (
        <span className="callout-icon" aria-hidden="true">
          {icon}
        </span>
      )}

      <div className="callout-content">
        {title && <h4 className="callout-title">{title}</h4>}

        <div className="callout-body">{children}</div>
      </div>

      {(actions || onDismiss) && (
        <div className="callout-actions">
          {actions}

          {onDismiss && (
            <Button
              ariaLabel={dismissLabel}
              icon={<IconSVG name="close" />}
              size="small"
              variant="tertiary"
              onClick={onDismiss}
            />
          )}
        </div>
      )}
    </StyledCallout>
  );
};

export default Callout;

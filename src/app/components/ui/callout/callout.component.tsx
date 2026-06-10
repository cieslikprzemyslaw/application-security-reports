import React from 'react';

import StyledCallout from './callout.styled';
import type { CalloutProps } from './callout.type';

const Callout = ({
  title,
  children,
  icon,
  actions,
  variant = 'info',
  ...rest
}: CalloutProps) => (
  <StyledCallout
    className={`callout callout--${variant}`}
    role={variant === 'error' ? 'alert' : 'status'}
    {...rest}
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

    {actions && <div className="callout-actions">{actions}</div>}
  </StyledCallout>
);

export default Callout;

import React from 'react';

import StyledCallout, {
  CalloutActions,
  CalloutBody,
  CalloutContent,
  CalloutIcon,
  CalloutTitle,
} from './callout.styled';
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
    role={variant === 'error' ? 'alert' : 'status'}
    $variant={variant}
    {...rest}
  >
    {icon && (
      <CalloutIcon className="callout-icon" aria-hidden="true">
        {icon}
      </CalloutIcon>
    )}

    <CalloutContent>
      {title && <CalloutTitle>{title}</CalloutTitle>}

      <CalloutBody>{children}</CalloutBody>
    </CalloutContent>

    {actions && <CalloutActions>{actions}</CalloutActions>}
  </StyledCallout>
);

export default Callout;

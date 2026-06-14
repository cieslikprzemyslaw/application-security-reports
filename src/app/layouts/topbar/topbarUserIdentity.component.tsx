import React from 'react';

import StyledTopbarUserIdentity, {
  StyledTopbarUserIdentityButton,
} from './topbarUserIdentity.styled';

import type { TopbarUserIdentityProps } from './topbarUserIdentity.type';

const getInitials = (fullName: string) =>
  fullName
    .trim()
    .split(/\s+/)
    .map(part => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

const TopbarUserIdentity = ({
  fullName,
  role,
  'aria-label': ariaLabel,
  onClick,
  ...rest
}: TopbarUserIdentityProps) => {
  const initials = getInitials(fullName);
  const isInteractive = typeof onClick === 'function';

  if (isInteractive) {
    return (
      <StyledTopbarUserIdentityButton
        data-interactive="true"
        aria-label={ariaLabel ?? `Local user: ${fullName}, ${role}`}
        onClick={onClick}
        {...rest}
      >
        <span className="topbar-user-identity-avatar" aria-hidden="true">
          {initials}
        </span>

        <span className="topbar-user-identity-copy">
          <strong className="topbar-user-identity-name">{fullName}</strong>

          <span className="topbar-user-identity-role">{role}</span>
        </span>
      </StyledTopbarUserIdentityButton>
    );
  }

  return (
    <StyledTopbarUserIdentity
      data-interactive="false"
      aria-label={ariaLabel ?? `Local user: ${fullName}, ${role}`}
      {...rest}
    >
      <span className="topbar-user-identity-avatar" aria-hidden="true">
        {initials}
      </span>

      <span className="topbar-user-identity-copy">
        <strong className="topbar-user-identity-name">{fullName}</strong>

        <span className="topbar-user-identity-role">{role}</span>
      </span>
    </StyledTopbarUserIdentity>
  );
};

export default TopbarUserIdentity;

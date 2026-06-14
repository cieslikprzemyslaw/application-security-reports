import React from 'react';

import StyledTopbarUserIdentity from './topbarUserIdentity.styled';

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
  type = 'button',
  'aria-label': ariaLabel,
  ...rest
}: TopbarUserIdentityProps) => {
  const initials = getInitials(fullName);

  return (
    <StyledTopbarUserIdentity
      type={type}
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

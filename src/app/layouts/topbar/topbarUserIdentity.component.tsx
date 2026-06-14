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

const TopbarUserIdentity = (props: TopbarUserIdentityProps) => {
  const {
    fullName,
    role,
    'aria-label': ariaLabel,
    className,
    id,
    style,
  } = props;
  const initials = getInitials(fullName);
  const isInteractive = typeof props.onClick === 'function';

  if (isInteractive) {
    const {
      fullName: _fullName,
      role: _role,
      'aria-label': _ariaLabel,
      onClick,
      ...buttonProps
    } = props;

    return (
      <StyledTopbarUserIdentityButton
        className={className}
        id={id}
        style={style}
        data-interactive="true"
        aria-label={ariaLabel ?? `Local user: ${fullName}, ${role}`}
        onClick={onClick}
        {...buttonProps}
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
      className={className}
      id={id}
      style={style}
      data-interactive="false"
      aria-label={ariaLabel ?? `Local user: ${fullName}, ${role}`}
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

import React from 'react';

import StyledTopbar from './topbar.styled';

import type { TopbarProps } from './topbar.type';

const Topbar = ({
  title,
  menuButton,
  search,
  actions,
  userMenu,
  ...rest
}: TopbarProps) => (
  <StyledTopbar {...rest}>
    {menuButton && <div className="topbar-menu">{menuButton}</div>}

    {title && <strong className="topbar-title">{title}</strong>}

    {search ? (
      <div className="topbar-search">{search}</div>
    ) : (
      <div className="topbar-spacer" />
    )}

    {actions && <div className="topbar-actions">{actions}</div>}

    {userMenu && <div className="topbar-user-menu">{userMenu}</div>}
  </StyledTopbar>
);

export default Topbar;

import React from 'react';

import StyledTopbar, {
  TopbarActions,
  TopbarMenu,
  TopbarSearch,
  TopbarSpacer,
  TopbarTitle,
  TopbarUserMenu,
} from './topbar.styled';

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
    {menuButton && <TopbarMenu>{menuButton}</TopbarMenu>}

    {title && <TopbarTitle>{title}</TopbarTitle>}

    {search ? <TopbarSearch>{search}</TopbarSearch> : <TopbarSpacer />}

    {actions && <TopbarActions>{actions}</TopbarActions>}

    {userMenu && <TopbarUserMenu>{userMenu}</TopbarUserMenu>}
  </StyledTopbar>
);

export default Topbar;

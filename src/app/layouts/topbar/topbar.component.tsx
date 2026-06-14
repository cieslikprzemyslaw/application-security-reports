import React from 'react';

import IconSVG from '~/app/components/ui/iconSVG';
import StyledTopbar from './topbar.styled';

import type { TopbarProps } from './topbar.type';

const Topbar = ({
  title,
  onMenuClick,
  menuButtonControls,
  menuButtonExpanded = false,
  search,
  actions,
  userMenu,
  ...rest
}: TopbarProps) => (
  <StyledTopbar {...rest}>
    {onMenuClick && (
      <div className="topbar-menu">
        <button
          type="button"
          className="topbar-menu-button"
          aria-label="Open navigation menu"
          aria-controls={menuButtonControls}
          aria-expanded={menuButtonExpanded}
          onClick={onMenuClick}
        >
          <IconSVG name="menu" />
        </button>
      </div>
    )}

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

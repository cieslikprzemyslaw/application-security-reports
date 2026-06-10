import React from 'react';

import StyledAppShell from './appShell.styled';

import type { AppShellProps } from './appShell.type';

const AppShell = ({
  sidebar,
  topbar,
  children,
  isSidebarOpen = false,
  onSidebarClose,
  sidebarId,
  ...rest
}: AppShellProps) => (
  <StyledAppShell {...rest}>
    <aside
      id={sidebarId}
      className="app-shell-sidebar"
      data-is-open={isSidebarOpen ? 'true' : 'false'}
    >
      {sidebar}
    </aside>

    <button
      className={[
        'app-shell-overlay',
        isSidebarOpen ? 'app-shell-overlay--open' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-is-open={isSidebarOpen ? 'true' : 'false'}
      type="button"
      aria-label="Close navigation"
      onClick={onSidebarClose}
    />

    <div className="app-shell-main">
      <div className="app-shell-topbar" data-print-hidden="true">
        {topbar}
      </div>

      <main className="app-shell-content">{children}</main>
    </div>
  </StyledAppShell>
);

export default AppShell;

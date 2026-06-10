import React from 'react';

import {
  AppShellContent,
  AppShellMain,
  AppShellOverlay,
  AppShellSidebar,
  AppShellTopbar,
  StyledAppShell,
} from './appShell.styled';

import type { AppShellProps } from './appShell.type';

const AppShell = ({
  sidebar,
  topbar,
  children,
  isSidebarOpen = false,
  onSidebarClose,
  ...rest
}: AppShellProps) => (
  <StyledAppShell {...rest}>
    <AppShellSidebar $isOpen={isSidebarOpen}>{sidebar}</AppShellSidebar>

    <AppShellOverlay
      type="button"
      aria-label="Close navigation"
      $isOpen={isSidebarOpen}
      onClick={onSidebarClose}
    />

    <AppShellMain>
      <AppShellTopbar>{topbar}</AppShellTopbar>

      <AppShellContent>{children}</AppShellContent>
    </AppShellMain>
  </StyledAppShell>
);

export default AppShell;

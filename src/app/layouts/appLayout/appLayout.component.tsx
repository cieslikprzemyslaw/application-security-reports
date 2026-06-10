import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { routes } from '~/routes';

import AppShell from '../appShell';
import PageContent from '../pageContent';
import Sidebar from '../sidebar';
import Topbar from '../topbar';

import type { SidebarNavigationGroup } from '../sidebar';

const sidebarId = 'app-layout-sidebar';

const navigationGroups: SidebarNavigationGroup[] = [
  {
    id: 'workspace',
    items: [
      { id: 'dashboard', label: 'Dashboard', href: routes.dashboard },
      { id: 'companies', label: 'Companies', href: routes.companies },
      { id: 'assessments', label: 'Assessments', href: routes.assessments },
      { id: 'threats', label: 'Threats', href: routes.threats },
      { id: 'reports', label: 'Reports', href: routes.reports },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [{ id: 'settings', label: 'Settings', href: routes.settings }],
  },
];

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <path d="M4 7h16M4 12h16M4 17h16" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const openSidebar = () => {
    setIsSidebarOpen(true);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <AppShell
      sidebarId={sidebarId}
      isSidebarOpen={isSidebarOpen}
      onSidebarClose={closeSidebar}
      sidebar={
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          brand={<strong>AppSec Reports</strong>}
          navigationGroups={navigationGroups}
          footer={<small>Local workspace</small>}
        />
      }
      topbar={
        <Topbar
          title="AppSec Report Builder"
          menuButton={
            <button
              type="button"
              className="app-layout-menu-button"
              aria-label="Open navigation"
              aria-controls={sidebarId}
              aria-expanded={isSidebarOpen}
              onClick={openSidebar}
            >
              <MenuIcon />
            </button>
          }
        />
      }
    >
      <PageContent maxWidth="wide" spacing="default">
        <Outlet />
      </PageContent>
    </AppShell>
  );
};

export default AppLayout;

import React, { Suspense, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import IconSVG from '~/app/components/ui/iconSVG';
import { routes } from '~/routes';
import packageJson from '../../../../package.json';
import {
  RouteLoadingView,
  RouteStateErrorBoundary,
} from '~/app/components/routeStateViews';

import AppShell from '../appShell';
import PageContent from '../pageContent';
import Sidebar from '../sidebar';
import Topbar from '../topbar';
import TopbarUserIdentity from '../topbar/topbarUserIdentity.component';

import type { SidebarNavigationGroup } from '../sidebar';

const sidebarId = 'app-layout-sidebar';

interface AppLayoutProps {
  activeCompanyName?: string;
}

const navigationGroups: SidebarNavigationGroup[] = [
  {
    id: 'workspace',
    items: [{ id: 'dashboard', label: 'Dashboard', href: routes.dashboard }],
  },
  {
    id: 'system',
    label: 'System',
    items: [{ id: 'settings', label: 'Settings', href: routes.settings }],
  },
];

const AppLayout = ({ activeCompanyName }: AppLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const openSidebar = () => {
    setIsSidebarOpen(true);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const sidebarBrand = (
    <div className="sidebar-brand-stack">
      <NavLink
        className={({ isActive }) =>
          [
            'sidebar-company-switcher',
            isActive ? 'sidebar-company-switcher--active' : '',
          ]
            .filter(Boolean)
            .join(' ')
        }
        to={routes.companies}
        onClick={() => {
          if (isSidebarOpen) {
            closeSidebar();
          }
        }}
      >
        <span className="sidebar-company-switcher-icon" aria-hidden="true">
          <IconSVG name="company" />
        </span>

        <span className="sidebar-company-switcher-text">
          <span className="sidebar-company-switcher-label">Company</span>
          <span className="sidebar-company-switcher-name">
            {activeCompanyName ?? 'Select company'}
          </span>
        </span>

        <IconSVG name="chevronDown" aria-hidden="true" />
      </NavLink>

      <strong className="sidebar-brand-title">AppSec Reports</strong>
    </div>
  );

  return (
    <AppShell
      sidebarId={sidebarId}
      isSidebarOpen={isSidebarOpen}
      onSidebarClose={closeSidebar}
      sidebar={
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          brand={sidebarBrand}
          navigationGroups={navigationGroups}
          footer={<small>Version {packageJson.version}</small>}
        />
      }
      topbar={
        <Topbar
          title="AppSec Report Builder"
          onMenuClick={openSidebar}
          menuButtonControls={sidebarId}
          menuButtonExpanded={isSidebarOpen}
          userMenu={
            <TopbarUserIdentity fullName="Alex Mercer" role="Lead Pentester" />
          }
        />
      }
    >
      <PageContent maxWidth="wide" spacing="default">
        <RouteStateErrorBoundary key={location.pathname}>
          <Suspense fallback={<RouteLoadingView />}>
            <Outlet />
          </Suspense>
        </RouteStateErrorBoundary>
      </PageContent>
    </AppShell>
  );
};

export default AppLayout;

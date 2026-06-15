import React, { Suspense, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import type { CompanyListItem } from '~/domain';
import { routes } from '~/routes';
import packageJson from '../../../../package.json';
import {
  RouteLoadingView,
  RouteStateErrorBoundary,
} from '~/app/components/routeStateViews';

import AppShell from '../appShell';
import PageContent from '../pageContent';
import CompanySwitcher from '../sidebar/companySwitcher.component';
import Sidebar from '../sidebar';
import Topbar from '../topbar';
import TopbarUserIdentity from '../topbar/topbarUserIdentity.component';
import type { CompanyIdentity } from '~/app/pages/companies';
import type { SidebarNavigationGroup } from '../sidebar';

const sidebarId = 'app-layout-sidebar';

interface AppLayoutProps {
  activeCompany?: CompanyIdentity;
  companies?: CompanyListItem[];
  isCompaniesLoading?: boolean;
  navigationGroups?: SidebarNavigationGroup[];
  onActiveCompanyChange?: (company?: CompanyIdentity) => void;
}

const defaultNavigationGroups: SidebarNavigationGroup[] = [
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

const AppLayout = ({
  activeCompany,
  companies = [],
  isCompaniesLoading = false,
  navigationGroups = defaultNavigationGroups,
  onActiveCompanyChange,
}: AppLayoutProps) => {
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
      <CompanySwitcher
        activeCompany={activeCompany}
        companies={companies}
        isLoading={isCompaniesLoading}
        onActiveCompanyChange={company => {
          onActiveCompanyChange?.(company);

          if (isSidebarOpen) {
            closeSidebar();
          }
        }}
      />

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

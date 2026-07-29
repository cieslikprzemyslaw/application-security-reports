import React, { Suspense, useEffect, useRef, useState } from 'react';
import { matchPath, Outlet, useLocation } from 'react-router-dom';
import type { CompanyListItem } from '~/domain';
import { routes, routePatterns } from '~/routes';
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
import { formatReportVersion } from '~/app/utils/formatters';
import type { CompanyIdentity } from '~/app/pages/companies';
import type { SidebarNavigationGroup } from '../sidebar';
import {
  appUserIdentityChangedEvent,
  readAppUserIdentity,
  type AppUserIdentity,
} from './appUserIdentity';

const sidebarId = 'app-layout-sidebar';
const mainContentId = 'app-main-content';

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
  const [userIdentity, setUserIdentity] = useState(readAppUserIdentity);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const wasSidebarOpenRef = useRef(false);
  const location = useLocation();
  const reportPreviewMatch = matchPath(
    { path: routePatterns.companyWorkspaceReportsPreview, end: true },
    location.pathname,
  );
  const reportPreviewCompanyId = reportPreviewMatch?.params.companyId;
  const routeBoundaryKey = reportPreviewCompanyId
    ? routes.companyWorkspaceReports(reportPreviewCompanyId)
    : location.pathname;

  useEffect(() => {
    const handleIdentityChange = (event: Event) => {
      const identity = (event as CustomEvent<AppUserIdentity>).detail;

      if (identity) {
        setUserIdentity(identity);
      }
    };

    window.addEventListener(appUserIdentityChangedEvent, handleIdentityChange);

    return () => {
      window.removeEventListener(
        appUserIdentityChangedEvent,
        handleIdentityChange,
      );
    };
  }, []);

  useEffect(() => {
    if (isSidebarOpen) {
      wasSidebarOpenRef.current = true;
      const frameId = window.requestAnimationFrame(() => {
        document
          .getElementById(sidebarId)
          ?.querySelector<HTMLElement>('.sidebar-close-button')
          ?.focus();
      });

      return () => window.cancelAnimationFrame(frameId);
    }

    if (wasSidebarOpenRef.current) {
      wasSidebarOpenRef.current = false;
      menuButtonRef.current?.focus();
    }

    return undefined;
  }, [isSidebarOpen]);

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
      mainContentId={mainContentId}
      isSidebarOpen={isSidebarOpen}
      onSidebarClose={closeSidebar}
      sidebar={
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          brand={sidebarBrand}
          navigationGroups={navigationGroups}
          footer={<small>{formatReportVersion(packageJson.version)}</small>}
        />
      }
      topbar={
        <Topbar
          title="AppSec Report Builder"
          onMenuClick={openSidebar}
          menuButtonControls={sidebarId}
          menuButtonExpanded={isSidebarOpen}
          menuButtonRef={menuButtonRef}
          userMenu={
            <TopbarUserIdentity
              fullName={userIdentity.fullName}
              role={userIdentity.role}
            />
          }
        />
      }
    >
      <PageContent maxWidth="wide" spacing="default">
        <RouteStateErrorBoundary key={routeBoundaryKey}>
          <Suspense fallback={<RouteLoadingView />}>
            <Outlet />
          </Suspense>
        </RouteStateErrorBoundary>
      </PageContent>
    </AppShell>
  );
};

export default AppLayout;

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  Navigate,
  Outlet,
  matchPath,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import {
  ApplicationErrorBoundary,
  EntityNotFoundView,
} from '~/app/components/routeStateViews';
import { AppLayout } from '~/app/layouts';
import { routes, routePatterns } from '~/routes';
import type { CompanyListItem } from '~/domain';
import { companyService } from '~/services';
import {
  readRecentCompanyOpenTimes,
  updateRecentCompanyOpenTimes,
  writeRecentCompanyOpenTimes,
} from '~/app/layouts/sidebar/companySwitcher.utils';
import CompanyWorkspaceRouteShell, {
  CompanyActivityRoute,
  CompanyAssessmentsRoute,
  CompanyWorkspaceIndexRoute,
  CompanyWorkspaceNotFoundRoute,
  createCompanyWorkspaceNavigationGroups,
} from './companyWorkspaceRoutes';
import {
  AssessmentsRoute,
  DashboardRoute,
  ReportsRoute,
  SettingsRoute,
  ThreatsRoute,
} from './routerPages';
import Reports from './pages/reports';

import { reportDetailsById } from './appData';
import type { CompanyIdentity } from './pages/companies';

interface RouterShellContextValue {
  activeCompany?: CompanyIdentity;
  activeCompanyId?: string;
  companies: CompanyListItem[];
  companiesLoadError?: string;
  isCompaniesLoading: boolean;
  onActiveCompanyChange: (company?: CompanyIdentity) => void;
  onCompaniesChange: (companies: CompanyListItem[]) => void;
  onRetryCompanies: () => void;
}

const RouterShellContext = createContext<RouterShellContextValue | undefined>(
  undefined,
);

const useRouterShellContext = () => {
  const context = useContext(RouterShellContext);

  if (!context) {
    throw new Error('Router shell context is unavailable.');
  }

  return context;
};

interface ReportDetailsRouteProps {
  reportId?: string;
}

const ReportDetailsRoute = ({ reportId }: ReportDetailsRouteProps) => {
  if (!reportId || !reportDetailsById[reportId]) {
    return (
      <EntityNotFoundView
        entityName="Report"
        listHref={routes.reports}
        listLabel="Return to reports"
      />
    );
  }

  const { cover } = reportDetailsById[reportId];

  return <Reports cover={cover} autoSaved={false} />;
};

const RedirectToDashboard = () => <Navigate replace to={routes.dashboard} />;

const ApplicationRouteBoundary = () => {
  const location = useLocation();

  return (
    <ApplicationErrorBoundary
      key={location.pathname}
      onReload={() => window.location.reload()}
    >
      <Outlet />
    </ApplicationErrorBoundary>
  );
};

const DashboardRouteElement = () => {
  const {
    companies,
    companiesLoadError,
    isCompaniesLoading,
    onActiveCompanyChange,
    onRetryCompanies,
  } = useRouterShellContext();

  return (
    <DashboardRoute
      companies={companies}
      companiesLoadError={companiesLoadError}
      isCompaniesLoading={isCompaniesLoading}
      onOpenCompany={onActiveCompanyChange}
      onRetryCompanies={onRetryCompanies}
    />
  );
};

const CompaniesRouteElement = () => {
  const { onActiveCompanyChange } = useRouterShellContext();

  return (
    <DashboardRoute
      companies={[]}
      companiesLoadError={undefined}
      isCompaniesLoading={false}
      onOpenCompany={onActiveCompanyChange}
      onRetryCompanies={() => undefined}
    />
  );
};

const CreateCompanyRouteElement = () => {
  const { companies, onActiveCompanyChange } = useRouterShellContext();

  return (
    <AppLayout
      activeCompany={undefined}
      companies={companies}
      isCompaniesLoading={false}
      navigationGroups={undefined}
      onActiveCompanyChange={onActiveCompanyChange}
    />
  );
};

const CompanyWorkspaceRouteShellElement = () => {
  const { companies, isCompaniesLoading } = useRouterShellContext();

  return (
    <CompanyWorkspaceRouteShell
      companies={companies}
      isCompaniesLoading={isCompaniesLoading}
    />
  );
};

const AssessmentsRouteElement = () => {
  const { activeCompanyId } = useRouterShellContext();

  return <AssessmentsRoute activeCompanyId={activeCompanyId} />;
};

const CompanyAssessmentsRouteElement = () => {
  const { activeCompany } = useRouterShellContext();

  return <CompanyAssessmentsRoute companyName={activeCompany?.name} />;
};

const CompanyActivityRouteElement = () => {
  const { activeCompany } = useRouterShellContext();

  return <CompanyActivityRoute companyName={activeCompany?.name} />;
};

const RouterShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [isCompaniesLoading, setIsCompaniesLoading] = useState(true);
  const [companiesLoadError, setCompaniesLoadError] = useState<
    string | undefined
  >();
  const [companiesReloadKey, setCompaniesReloadKey] = useState(0);
  const [selectedCompanyId, setSelectedCompanyId] = useState<
    string | undefined
  >(
    () =>
      matchPath(
        { path: routePatterns.companyWorkspace, end: false },
        location.pathname,
      )?.params.companyId,
  );

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadCompanies = async () => {
      setIsCompaniesLoading(true);
      setCompaniesLoadError(undefined);

      try {
        const nextCompanies = await companyService.list(controller.signal);

        if (isActive) {
          setCompanies(nextCompanies);
        }
      } catch (error) {
        if (
          !isActive ||
          (error instanceof DOMException && error.name === 'AbortError')
        ) {
          return;
        }

        setCompanies([]);
        setCompaniesLoadError(
          error instanceof Error ? error.message : 'Unable to load companies.',
        );
      } finally {
        if (isActive) {
          setIsCompaniesLoading(false);
        }
      }
    };

    void loadCompanies();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [companiesReloadKey]);

  const reloadCompanies = () => {
    setCompaniesReloadKey(key => key + 1);
  };

  const companyWorkspaceMatch = matchPath(
    { path: routePatterns.companyWorkspace, end: false },
    location.pathname,
  );
  const currentCompanyId = companyWorkspaceMatch?.params.companyId;
  const activeCompanyId = currentCompanyId ?? selectedCompanyId;

  const activeCompany = activeCompanyId
    ? companies.find(
        (company: CompanyListItem) => company.id === activeCompanyId,
      )
    : undefined;

  const handleActiveCompanyChange = (company?: CompanyIdentity) => {
    if (company) {
      const nextRecentCompanyOpenTimes = updateRecentCompanyOpenTimes(
        readRecentCompanyOpenTimes(),
        company.id,
      );

      writeRecentCompanyOpenTimes(nextRecentCompanyOpenTimes);
      setSelectedCompanyId(company.id);
      navigate(routes.companyWorkspaceOverview(company.id));
      return;
    }

    setSelectedCompanyId(undefined);
  };
  const handleCompaniesChange = useCallback(
    (nextCompanies: CompanyListItem[]) => {
      setCompanies(nextCompanies);
    },
    [],
  );
  const navigationGroups =
    activeCompanyId && (isCompaniesLoading || activeCompany)
      ? createCompanyWorkspaceNavigationGroups(activeCompanyId)
      : undefined;

  return (
    <RouterShellContext.Provider
      value={{
        activeCompany,
        activeCompanyId,
        companies,
        companiesLoadError,
        isCompaniesLoading,
        onActiveCompanyChange: handleActiveCompanyChange,
        onCompaniesChange: handleCompaniesChange,
        onRetryCompanies: reloadCompanies,
      }}
    >
      <AppLayout
        key={activeCompany?.id ?? activeCompanyId ?? 'no-active-company'}
        activeCompany={activeCompany}
        companies={companies}
        isCompaniesLoading={isCompaniesLoading}
        navigationGroups={navigationGroups}
        onActiveCompanyChange={handleActiveCompanyChange}
      />
    </RouterShellContext.Provider>
  );
};

export {
  ApplicationRouteBoundary,
  AssessmentsRouteElement,
  CompaniesRouteElement,
  CompanyActivityRouteElement,
  CompanyAssessmentsRouteElement,
  CompanyWorkspaceIndexRoute,
  CompanyWorkspaceNotFoundRoute,
  CompanyWorkspaceRouteShellElement,
  CreateCompanyRouteElement,
  DashboardRouteElement,
  RedirectToDashboard,
  ReportDetailsRoute,
  ReportsRoute,
  RouterShell,
  SettingsRoute,
  ThreatsRoute,
};

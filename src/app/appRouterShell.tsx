import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Navigate,
  Outlet,
  matchPath,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { ApplicationErrorBoundary } from '~/app/components/routeStateViews';
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
  CompanyReportsRoute,
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
import Companies, { type CompanyIdentity } from './pages/companies';
import CreateCompany from './pages/companies/createCompany.component';

interface RouterShellContextValue {
  activeCompany?: CompanyIdentity;
  activeCompanyId?: string;
  companies: CompanyListItem[];
  companiesLoadError?: string;
  isCompaniesLoading: boolean;
  hasLoadedCompanies: boolean;
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

const RedirectToDashboard = () => <Navigate replace to={routes.dashboard} />;

const ApplicationRouteBoundary = () => {
  const location = useLocation();

  return (
    <ApplicationErrorBoundary
      resetKey={location.pathname}
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
    hasLoadedCompanies,
    onActiveCompanyChange,
    onRetryCompanies,
  } = useRouterShellContext();

  return (
    <DashboardRoute
      companies={companies}
      companiesLoadError={companiesLoadError}
      isCompaniesLoading={isCompaniesLoading}
      hasLoadedCompanies={hasLoadedCompanies}
      onOpenCompany={onActiveCompanyChange}
      onRetryCompanies={onRetryCompanies}
    />
  );
};

const CompaniesRouteElement = () => {
  const { activeCompany, onActiveCompanyChange, onCompaniesChange } =
    useRouterShellContext();

  return (
    <Companies
      activeCompany={activeCompany}
      onActiveCompanyChange={onActiveCompanyChange}
      onCompaniesChange={onCompaniesChange}
    />
  );
};

const CreateCompanyRouteElement = () => {
  const { companies, onActiveCompanyChange, onCompaniesChange } =
    useRouterShellContext();

  return (
    <CreateCompany
      companies={companies}
      onCompaniesChange={onCompaniesChange}
      onActiveCompanyChange={onActiveCompanyChange}
    />
  );
};

const CompanyWorkspaceRouteShellElement = () => {
  const {
    companies,
    companiesLoadError,
    isCompaniesLoading,
    hasLoadedCompanies,
    onRetryCompanies,
  } = useRouterShellContext();

  return (
    <CompanyWorkspaceRouteShell
      companies={companies}
      companiesLoadError={companiesLoadError}
      isCompaniesLoading={isCompaniesLoading}
      hasLoadedCompanies={hasLoadedCompanies}
      onRetryCompanies={onRetryCompanies}
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

const CompanyReportsRouteElement = () => {
  const { activeCompany } = useRouterShellContext();

  return <CompanyReportsRoute companyName={activeCompany?.name} />;
};

const RouterShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [isCompaniesLoading, setIsCompaniesLoading] = useState(true);
  const [hasLoadedCompanies, setHasLoadedCompanies] = useState(false);
  const hasLoadedCompaniesRef = useRef(false);
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
          hasLoadedCompaniesRef.current = true;
          setHasLoadedCompanies(true);
        }
      } catch (error) {
        if (
          !isActive ||
          (error instanceof DOMException && error.name === 'AbortError')
        ) {
          return;
        }

        if (!hasLoadedCompaniesRef.current) {
          setCompanies([]);
        }

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
      hasLoadedCompaniesRef.current = true;
      setHasLoadedCompanies(true);
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
        hasLoadedCompanies,
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
  CompanyReportsRouteElement,
  CompanyWorkspaceIndexRoute,
  CompanyWorkspaceNotFoundRoute,
  CompanyWorkspaceRouteShellElement,
  CreateCompanyRouteElement,
  DashboardRouteElement,
  RedirectToDashboard,
  ReportsRoute,
  RouterShell,
  SettingsRoute,
  ThreatsRoute,
};

import React, {
  createContext,
  lazy,
  useContext,
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Route,
  RouterProvider,
  matchPath,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';

import { EntityNotFoundView } from '~/app/components/routeStateViews';
import { AppLayout } from '~/app/layouts';
import NotFound from '~/app/pages/notFound';
import { routes, routePatterns } from '~/routes';
import type { CompanyListItem } from '~/domain';
import { companyService } from '~/services';
import {
  readRecentCompanyOpenTimes,
  updateRecentCompanyOpenTimes,
  writeRecentCompanyOpenTimes,
} from '~/app/layouts/sidebar/companySwitcher.utils';
import type { AssessmentDetailSection } from './pages/assessmentDetails/assessmentDetails.type';
import CompanyWorkspaceRouteShell, {
  CompanyActivityRoute,
  CompanyAssessmentsRoute,
  CompanyOverviewRoute,
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

import { reportDetailsById } from './appData';
import type { CompanyIdentity } from './pages/companies';

const Companies = lazy(() => import('./pages/companies'));
const CreateCompany = lazy(
  () => import('./pages/companies/createCompany.component'),
);
const AssessmentDetails = lazy(() => import('./pages/assessmentDetails'));
const ReportDetails = lazy(() => import('./pages/reportDetails'));

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

interface CompaniesRouteProps {
  activeCompany?: CompanyIdentity;
  onCompaniesChange: (companies: CompanyListItem[]) => void;
  onActiveCompanyChange: (company?: CompanyIdentity) => void;
}

const CompaniesRoute = ({
  activeCompany,
  onCompaniesChange,
  onActiveCompanyChange,
}: CompaniesRouteProps) => (
  <Companies
    activeCompany={activeCompany}
    onCompaniesChange={onCompaniesChange}
    onActiveCompanyChange={onActiveCompanyChange}
  />
);

interface AssessmentDetailsRouteProps {
  section: AssessmentDetailSection;
}

const AssessmentDetailsRoute = ({ section }: AssessmentDetailsRouteProps) => {
  return <AssessmentDetails activeSection={section} />;
};

const ReportDetailsRoute = () => {
  const { reportId } = useParams<{
    reportId?: string;
  }>();

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

  return <ReportDetails cover={cover} autoSaved={false} />;
};

const RedirectToDashboard = () => <Navigate replace to={routes.dashboard} />;

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
  const { activeCompany, onActiveCompanyChange, onCompaniesChange } =
    useRouterShellContext();

  return (
    <CompaniesRoute
      activeCompany={activeCompany}
      onCompaniesChange={onCompaniesChange}
      onActiveCompanyChange={onActiveCompanyChange}
    />
  );
};

const CreateCompanyRouteElement = () => {
  const { companies, onCompaniesChange, onActiveCompanyChange } =
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

const createAppRouter = () =>
  createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path={routePatterns.root} element={<RedirectToDashboard />} />
        <Route element={<RouterShell />}>
          <Route
            path={routePatterns.dashboard}
            element={<DashboardRouteElement />}
          />
          <Route
            path={routePatterns.companies}
            element={<CompaniesRouteElement />}
          />
          <Route
            path={routePatterns.companiesNew}
            element={<CreateCompanyRouteElement />}
          />
          <Route
            path={routePatterns.companyWorkspace}
            element={<CompanyWorkspaceRouteShellElement />}
          >
            <Route index element={<CompanyWorkspaceIndexRoute />} />
            <Route path="overview" element={<CompanyOverviewRoute />} />
            <Route
              path="assessments"
              element={<CompanyAssessmentsRouteElement />}
            />
            <Route path="reports" element={<CompanyReportsRoute />} />
            <Route path="activity" element={<CompanyActivityRouteElement />} />
            <Route path="*" element={<CompanyWorkspaceNotFoundRoute />} />
          </Route>
          <Route
            path={routePatterns.assessments}
            element={<AssessmentsRouteElement />}
          />
          <Route
            path={routePatterns.assessmentDetails}
            element={<AssessmentDetailsRoute section="overview" />}
          />
          <Route
            path={routePatterns.assessmentDetailsOverview}
            element={<AssessmentDetailsRoute section="overview" />}
          />
          <Route
            path={routePatterns.assessmentDetailsFindings}
            element={<AssessmentDetailsRoute section="findings" />}
          />
          <Route
            path={routePatterns.assessmentDetailsEvidence}
            element={<AssessmentDetailsRoute section="evidence" />}
          />
          <Route
            path={routePatterns.assessmentDetailsReports}
            element={<AssessmentDetailsRoute section="reports" />}
          />
          <Route
            path={routePatterns.assessmentDetailsHistory}
            element={<AssessmentDetailsRoute section="history" />}
          />
          <Route
            path={routePatterns.reportDetails}
            element={<ReportDetailsRoute />}
          />
          <Route path={routePatterns.threats} element={<ThreatsRoute />} />
          <Route path={routePatterns.reports} element={<ReportsRoute />} />
          <Route path={routePatterns.settings} element={<SettingsRoute />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </>,
    ),
  );

const AppRouter = () => {
  const [router] = useState(createAppRouter);

  return <RouterProvider router={router} />;
};

export default AppRouter;

import React, { lazy, useEffect, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  matchPath,
  useNavigate,
  useLocation,
  useParams,
} from 'react-router-dom';

import { EntityNotFoundView } from '~/app/components/routeStateViews';
import { AppLayout } from '~/app/layouts';
import NotFound from '~/app/pages/notFound';
import { routes, routePatterns } from '~/routes';
import type { CompanyListItem } from '~/domain';
import { companyService } from '~/services';
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

import { assessmentDetailsById, reportDetailsById } from './appData';
import type { CompanyIdentity } from './pages/companies';

const Companies = lazy(() => import('./pages/companies'));
const AssessmentDetails = lazy(() => import('./pages/assessmentDetails'));
const ReportDetails = lazy(() => import('./pages/reportDetails'));

interface CompaniesRouteProps {
  activeCompany?: CompanyIdentity;
  openCreateDrawer?: boolean;
  onCompaniesChange: (companies: CompanyListItem[]) => void;
  onActiveCompanyChange: (company?: CompanyIdentity) => void;
}

const CompaniesRoute = ({
  activeCompany,
  openCreateDrawer,
  onCompaniesChange,
  onActiveCompanyChange,
}: CompaniesRouteProps) => (
  <Companies
    activeCompany={activeCompany}
    openCreateDrawer={openCreateDrawer}
    onCompaniesChange={onCompaniesChange}
    onActiveCompanyChange={onActiveCompanyChange}
  />
);

const AssessmentDetailsRoute = () => {
  const navigate = useNavigate();
  const { assessmentId } = useParams<{
    assessmentId?: string;
  }>();

  if (!assessmentId || !assessmentDetailsById[assessmentId]) {
    return (
      <EntityNotFoundView
        entityName="Assessment"
        listHref={routes.assessments}
        listLabel="Return to assessments"
      />
    );
  }

  const {
    assessment,
    executiveSummary: summary,
    threats: assessmentThreats,
  } = assessmentDetailsById[assessmentId];

  return (
    <AssessmentDetails
      assessment={assessment}
      threats={assessmentThreats}
      executiveSummary={summary}
      onBack={() => navigate(routes.assessments)}
    />
  );
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

const RouterShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [isCompaniesLoading, setIsCompaniesLoading] = useState(true);
  const companiesLocationState = location.state as
    | { openCreateDrawer?: boolean }
    | null
    | undefined;

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadCompanies = async () => {
      setIsCompaniesLoading(true);

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
  }, []);

  const handleActiveCompanyChange = (company?: CompanyIdentity) => {
    if (company) {
      navigate(routes.companyWorkspaceOverview(company.id));
    }
  };

  const companyWorkspaceMatch = matchPath(
    { path: routePatterns.companyWorkspace, end: false },
    location.pathname,
  );
  const currentCompanyId = companyWorkspaceMatch?.params.companyId;
  const activeCompany = currentCompanyId
    ? companies.find(
        (company: CompanyListItem) => company.id === currentCompanyId,
      )
    : undefined;
  const navigationGroups =
    currentCompanyId && (isCompaniesLoading || activeCompany)
      ? createCompanyWorkspaceNavigationGroups(currentCompanyId)
      : undefined;

  return (
    <Routes>
      <Route path={routePatterns.root} element={<RedirectToDashboard />} />

      <Route
        element={
          <AppLayout
            key={activeCompany?.id ?? 'no-active-company'}
            activeCompany={activeCompany}
            companies={companies}
            isCompaniesLoading={isCompaniesLoading}
            navigationGroups={navigationGroups}
            onActiveCompanyChange={handleActiveCompanyChange}
          />
        }
      >
        <Route
          path={routePatterns.dashboard}
          element={
            <DashboardRoute
              isWorkspaceEmpty={!isCompaniesLoading && companies.length === 0}
            />
          }
        />
        <Route
          path={routePatterns.companies}
          element={
            <CompaniesRoute
              activeCompany={activeCompany}
              openCreateDrawer={Boolean(
                companiesLocationState?.openCreateDrawer,
              )}
              onCompaniesChange={setCompanies}
              onActiveCompanyChange={handleActiveCompanyChange}
            />
          }
        />
        <Route
          path={routePatterns.companyWorkspace}
          element={
            <CompanyWorkspaceRouteShell
              companies={companies}
              isCompaniesLoading={isCompaniesLoading}
            />
          }
        >
          <Route index element={<CompanyWorkspaceIndexRoute />} />
          <Route path="overview" element={<CompanyOverviewRoute />} />
          <Route path="assessments" element={<CompanyAssessmentsRoute />} />
          <Route path="reports" element={<CompanyReportsRoute />} />
          <Route path="activity" element={<CompanyActivityRoute />} />
          <Route path="*" element={<CompanyWorkspaceNotFoundRoute />} />
        </Route>
        <Route
          path={routePatterns.assessments}
          element={<AssessmentsRoute />}
        />
        <Route
          path={routePatterns.assessmentDetails}
          element={<AssessmentDetailsRoute />}
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
    </Routes>
  );
};

const AppRouter = () => (
  <BrowserRouter>
    <RouterShell />
  </BrowserRouter>
);

export default AppRouter;

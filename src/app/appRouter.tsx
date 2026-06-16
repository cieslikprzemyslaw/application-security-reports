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
  const companiesLocationState = location.state as
    | { openCreateDrawer?: boolean }
    | null
    | undefined;

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
  const navigationGroups =
    activeCompanyId && (isCompaniesLoading || activeCompany)
      ? createCompanyWorkspaceNavigationGroups(activeCompanyId)
      : undefined;

  return (
    <Routes>
      <Route path={routePatterns.root} element={<RedirectToDashboard />} />

      <Route
        element={
          <AppLayout
            key={activeCompany?.id ?? activeCompanyId ?? 'no-active-company'}
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
              companies={companies}
              companiesLoadError={companiesLoadError}
              isCompaniesLoading={isCompaniesLoading}
              onOpenCompany={handleActiveCompanyChange}
              onRetryCompanies={reloadCompanies}
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
          element={<AssessmentsRoute activeCompanyId={activeCompany?.id} />}
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
    </Routes>
  );
};

const AppRouter = () => (
  <BrowserRouter>
    <RouterShell />
  </BrowserRouter>
);

export default AppRouter;

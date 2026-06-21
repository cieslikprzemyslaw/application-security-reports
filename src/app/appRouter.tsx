import React, { lazy, useState } from 'react';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  useParams,
} from 'react-router-dom';

import { EntityNotFoundView } from '~/app/components/routeStateViews';
import NotFound from '~/app/pages/notFound';
import { routes, routePatterns } from '~/routes';
import type { AssessmentDetailSection } from './pages/assessmentDetails/assessmentDetails.type';
import { reportDetailsById } from './appData';
import {
  ApplicationRouteBoundary,
  AssessmentsRouteElement,
  CompaniesRouteElement,
  CompanyActivityRouteElement,
  CompanyAssessmentsRouteElement,
  CompanyWorkspaceRouteShellElement,
  DashboardRouteElement,
  RedirectToDashboard,
  CreateCompanyRouteElement,
  RouterShell,
} from './appRouterShell';
import {
  CompanyOverviewRoute,
  CompanyReportsRoute,
  CompanyWorkspaceIndexRoute,
  CompanyWorkspaceNotFoundRoute,
} from './companyWorkspaceRoutes';
import { ReportsRoute, SettingsRoute, ThreatsRoute } from './routerPages';

const AssessmentDetails = lazy(() => import('./pages/assessmentDetails'));
const ReportDetails = lazy(() => import('./pages/reportDetails'));

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

const createAppRouter = () =>
  createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route element={<ApplicationRouteBoundary />}>
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
              <Route
                path="activity"
                element={<CompanyActivityRouteElement />}
              />
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
        </Route>
      </>,
    ),
  );

const AppRouter = () => {
  const [router] = useState(createAppRouter);

  return <RouterProvider router={router} />;
};

export default AppRouter;

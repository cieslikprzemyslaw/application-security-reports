const assertNonEmptyId = (value: string, routeName: string) => {
  if (value.trim().length === 0) {
    throw new Error(`${routeName} requires a non-empty id.`);
  }
};

const buildRouteWithId = (basePath: string, id: string, routeName: string) => {
  assertNonEmptyId(id, routeName);

  return `${basePath}/${encodeURIComponent(id)}`;
};

const buildCompanyWorkspaceRoute = (companyId: string, routeName: string) =>
  buildRouteWithId(routePatterns.companies, companyId, routeName);

export const routePatterns = {
  root: '/',
  dashboard: '/dashboard',
  companies: '/companies',
  companyWorkspace: '/companies/:companyId',
  companyWorkspaceOverview: '/companies/:companyId/overview',
  companyWorkspaceAssessments: '/companies/:companyId/assessments',
  companyWorkspaceReports: '/companies/:companyId/reports',
  companyWorkspaceActivity: '/companies/:companyId/activity',
  assessments: '/assessments',
  assessmentDetails: '/assessments/:assessmentId',
  assessmentDetailsOverview: '/assessments/:assessmentId/overview',
  assessmentDetailsFindings: '/assessments/:assessmentId/findings',
  assessmentDetailsEvidence: '/assessments/:assessmentId/evidence',
  assessmentDetailsReports: '/assessments/:assessmentId/reports',
  assessmentDetailsHistory: '/assessments/:assessmentId/history',
  threats: '/threats',
  reports: '/reports',
  reportDetails: '/reports/:reportId',
  settings: '/settings',
} as const;

export const routes = {
  root: routePatterns.root,
  dashboard: routePatterns.dashboard,
  companies: routePatterns.companies,
  companyWorkspace: (companyId: string) =>
    buildCompanyWorkspaceRoute(companyId, 'companyWorkspace'),
  companyWorkspaceOverview: (companyId: string) =>
    `${buildCompanyWorkspaceRoute(companyId, 'companyWorkspace')}/overview`,
  companyWorkspaceAssessments: (companyId: string) =>
    `${buildCompanyWorkspaceRoute(companyId, 'companyWorkspace')}/assessments`,
  companyWorkspaceReports: (companyId: string) =>
    `${buildCompanyWorkspaceRoute(companyId, 'companyWorkspace')}/reports`,
  companyWorkspaceActivity: (companyId: string) =>
    `${buildCompanyWorkspaceRoute(companyId, 'companyWorkspace')}/activity`,
  assessments: routePatterns.assessments,
  assessmentDetails: (assessmentId: string) =>
    buildRouteWithId(
      routePatterns.assessments,
      assessmentId,
      'assessmentDetails',
    ),
  assessmentDetailsOverview: (assessmentId: string) =>
    `${buildRouteWithId(
      routePatterns.assessments,
      assessmentId,
      'assessmentDetails',
    )}/overview`,
  assessmentDetailsFindings: (assessmentId: string) =>
    `${buildRouteWithId(
      routePatterns.assessments,
      assessmentId,
      'assessmentDetails',
    )}/findings`,
  assessmentDetailsEvidence: (assessmentId: string) =>
    `${buildRouteWithId(
      routePatterns.assessments,
      assessmentId,
      'assessmentDetails',
    )}/evidence`,
  assessmentDetailsReports: (assessmentId: string) =>
    `${buildRouteWithId(
      routePatterns.assessments,
      assessmentId,
      'assessmentDetails',
    )}/reports`,
  assessmentDetailsHistory: (assessmentId: string) =>
    `${buildRouteWithId(
      routePatterns.assessments,
      assessmentId,
      'assessmentDetails',
    )}/history`,
  threats: routePatterns.threats,
  reports: routePatterns.reports,
  reportDetails: (reportId: string) =>
    buildRouteWithId(routePatterns.reports, reportId, 'reportDetails'),
  settings: routePatterns.settings,
} as const;

export type RoutePatterns = typeof routePatterns;
export type Routes = typeof routes;

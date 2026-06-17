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

const buildAssessmentWorkspaceRoute = (
  companyId: string,
  assessmentId: string,
  routeName: string,
) => {
  assertNonEmptyId(companyId, routeName);

  return buildRouteWithId(
    `${buildCompanyWorkspaceRoute(companyId, routeName)}/assessments`,
    assessmentId,
    routeName,
  );
};

export const routePatterns = {
  root: '/',
  dashboard: '/dashboard',
  companies: '/companies',
  companiesNew: '/companies/new',
  companyWorkspace: '/companies/:companyId',
  companyWorkspaceOverview: '/companies/:companyId/overview',
  companyWorkspaceAssessments: '/companies/:companyId/assessments',
  companyWorkspaceReports: '/companies/:companyId/reports',
  companyWorkspaceActivity: '/companies/:companyId/activity',
  assessments: '/assessments',
  assessmentDetails: '/companies/:companyId/assessments/:assessmentId',
  assessmentDetailsOverview:
    '/companies/:companyId/assessments/:assessmentId/overview',
  assessmentDetailsFindings:
    '/companies/:companyId/assessments/:assessmentId/findings',
  assessmentDetailsEvidence:
    '/companies/:companyId/assessments/:assessmentId/evidence',
  assessmentDetailsReports:
    '/companies/:companyId/assessments/:assessmentId/reports',
  assessmentDetailsHistory:
    '/companies/:companyId/assessments/:assessmentId/history',
  threats: '/threats',
  reports: '/reports',
  reportDetails: '/reports/:reportId',
  settings: '/settings',
} as const;

export const routes = {
  root: routePatterns.root,
  dashboard: routePatterns.dashboard,
  companies: routePatterns.companies,
  companiesNew: routePatterns.companiesNew,
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
  assessmentDetails: (companyId: string, assessmentId: string) =>
    buildAssessmentWorkspaceRoute(companyId, assessmentId, 'assessmentDetails'),
  assessmentDetailsOverview: (companyId: string, assessmentId: string) =>
    `${buildAssessmentWorkspaceRoute(
      companyId,
      assessmentId,
      'assessmentDetails',
    )}/overview`,
  assessmentDetailsFindings: (companyId: string, assessmentId: string) =>
    `${buildAssessmentWorkspaceRoute(
      companyId,
      assessmentId,
      'assessmentDetails',
    )}/findings`,
  assessmentDetailsEvidence: (companyId: string, assessmentId: string) =>
    `${buildAssessmentWorkspaceRoute(
      companyId,
      assessmentId,
      'assessmentDetails',
    )}/evidence`,
  assessmentDetailsReports: (companyId: string, assessmentId: string) =>
    `${buildAssessmentWorkspaceRoute(
      companyId,
      assessmentId,
      'assessmentDetails',
    )}/reports`,
  assessmentDetailsHistory: (companyId: string, assessmentId: string) =>
    `${buildAssessmentWorkspaceRoute(
      companyId,
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

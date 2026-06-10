const assertNonEmptyId = (value: string, routeName: string) => {
  if (value.trim().length === 0) {
    throw new Error(`${routeName} requires a non-empty id.`);
  }
};

const buildRouteWithId = (basePath: string, id: string, routeName: string) => {
  assertNonEmptyId(id, routeName);

  return `${basePath}/${encodeURIComponent(id)}`;
};

export const routePatterns = {
  dashboard: '/',
  companies: '/companies',
  assessments: '/assessments',
  assessmentDetails: '/assessments/:assessmentId',
  threats: '/threats',
  reports: '/reports',
  reportDetails: '/reports/:reportId',
  settings: '/settings',
} as const;

export const routes = {
  dashboard: routePatterns.dashboard,
  companies: routePatterns.companies,
  assessments: routePatterns.assessments,
  assessmentDetails: (assessmentId: string) =>
    buildRouteWithId(
      routePatterns.assessments,
      assessmentId,
      'assessmentDetails',
    ),
  threats: routePatterns.threats,
  reports: routePatterns.reports,
  reportDetails: (reportId: string) =>
    buildRouteWithId(routePatterns.reports, reportId, 'reportDetails'),
  settings: routePatterns.settings,
} as const;

export type RoutePatterns = typeof routePatterns;
export type Routes = typeof routes;

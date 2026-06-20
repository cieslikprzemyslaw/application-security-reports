import { runStartupAndRouteBoundaryTests } from './appRouter.tests/startupAndRouteBoundaries';
import { runDashboardRecentCompanyTests } from './appRouter.tests/dashboardRecentCompanies';
import { runCompanyListAndCreationTests } from './appRouter.tests/companyListAndCreation';
import { runCompanyWorkspaceOverviewRouteTests } from './appRouter.tests/companyWorkspaceOverviewRoutes';
import { runCompanyWorkspaceChildRouteTests } from './appRouter.tests/companyWorkspaceChildRoutes';
import { runCompanyWorkspaceMissingNavigationTests } from './appRouter.tests/companyWorkspaceMissingNavigation';
import { runCompanySwitcherNavigationTests } from './appRouter.tests/companySwitcherNavigation';
import { runGlobalRoutesAndSettingsTests } from './appRouter.tests/globalRoutesAndSettings';
import { runAssessmentWorkspaceNavigationTests } from './appRouter.tests/assessmentWorkspaceNavigation';
import { runAssessmentWorkspaceFilterTests } from './appRouter.tests/assessmentWorkspaceFilters';
import { runAssessmentWorkspaceOverviewActionTests } from './appRouter.tests/assessmentWorkspaceOverviewActions';
import { runAssessmentWorkspaceReportsAndMissingTests } from './appRouter.tests/assessmentWorkspaceReportsAndMissing';
import { runReportDetailsAndFallbackRouteTests } from './appRouter.tests/reportDetailsAndFallbackRoutes';

await (async () => {
  await runStartupAndRouteBoundaryTests();
  await runDashboardRecentCompanyTests();
  await runCompanyListAndCreationTests();
  await runCompanyWorkspaceOverviewRouteTests();
  await runCompanyWorkspaceChildRouteTests();
  await runCompanyWorkspaceMissingNavigationTests();
  await runCompanySwitcherNavigationTests();
  await runGlobalRoutesAndSettingsTests();
  await runAssessmentWorkspaceNavigationTests();
  await runAssessmentWorkspaceFilterTests();
  await runAssessmentWorkspaceOverviewActionTests();
  await runAssessmentWorkspaceReportsAndMissingTests();
  await runReportDetailsAndFallbackRouteTests();

  console.log('router checks passed');
})();

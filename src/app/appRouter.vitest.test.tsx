import { describe, it } from 'vitest';

import { runStartupAndRouteBoundaryTests } from './appRouter.tests/startupAndRouteBoundaries';
import { runDashboardRecentCompanyTests } from './appRouter.tests/dashboardRecentCompanies';
import { runCompanyListAndCreationTests } from './appRouter.tests/companyListAndCreation';
import { runCompanyWorkflowStateTests } from './appRouter.tests/companyWorkflowStates';
import { runCompanyWorkflowEditTests } from './appRouter.tests/companyWorkflowEdit';
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

describe('appRouter', () => {
  it('passes the router checks', async () => {
    await runStartupAndRouteBoundaryTests();
    await runDashboardRecentCompanyTests();
    await runCompanyListAndCreationTests();
    await runCompanyWorkflowStateTests();
    await runCompanyWorkflowEditTests();
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
  }, 60_000);
});

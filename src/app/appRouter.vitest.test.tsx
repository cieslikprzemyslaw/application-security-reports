import { describe, it } from 'vitest';

import {
  runStartupAndRouteBoundaryTests,
} from './appRouter.tests/startupAndRouteBoundaries';
import {
  runDashboardRecentCompanyTests,
} from './appRouter.tests/dashboardRecentCompanies';
import {
  runCompanyListAndCreationTests,
} from './appRouter.tests/companyListAndCreation';
import {
  runCompanyWorkflowStateTests,
} from './appRouter.tests/companyWorkflowStates';
import {
  runCompanyWorkflowEditTests,
} from './appRouter.tests/companyWorkflowEdit';
import {
  runCompanyWorkspaceOverviewRouteTests,
} from './appRouter.tests/companyWorkspaceOverviewRoutes';
import {
  runCompanyWorkspaceChildRouteTests,
} from './appRouter.tests/companyWorkspaceChildRoutes';
import {
  runCompanyWorkspaceMissingNavigationTests,
} from './appRouter.tests/companyWorkspaceMissingNavigation';
import {
  runCompanySwitcherNavigationTests,
} from './appRouter.tests/companySwitcherNavigation';
import {
  runGlobalRoutesAndSettingsTests,
} from './appRouter.tests/globalRoutesAndSettings';
import {
  runAssessmentWorkspaceNavigationTests,
} from './appRouter.tests/assessmentWorkspaceNavigation';
import {
  runAssessmentWorkspaceFilterTests,
} from './appRouter.tests/assessmentWorkspaceFilters';
import {
  runAssessmentWorkspaceOverviewActionTests,
} from './appRouter.tests/assessmentWorkspaceOverviewActions';
import {
  runAssessmentWorkspaceReportsAndMissingTests,
} from './appRouter.tests/assessmentWorkspaceReportsAndMissing';
import {
  runReportDetailsAndFallbackRouteTests,
} from './appRouter.tests/reportDetailsAndFallbackRoutes';

type RouterWorkflowCheck = {
  name: string;
  run: () => Promise<void>;
};

const routerWorkflowChecks: RouterWorkflowCheck[] = [
  {
    name: 'startup and route boundaries',
    run: runStartupAndRouteBoundaryTests,
  },
  {
    name: 'dashboard recent companies',
    run: runDashboardRecentCompanyTests,
  },
  {
    name: 'company list and creation',
    run: runCompanyListAndCreationTests,
  },
  {
    name: 'company workflow states',
    run: runCompanyWorkflowStateTests,
  },
  {
    name: 'company workflow edit',
    run: runCompanyWorkflowEditTests,
  },
  {
    name: 'company workspace overview routes',
    run: runCompanyWorkspaceOverviewRouteTests,
  },
  {
    name: 'company workspace child routes',
    run: runCompanyWorkspaceChildRouteTests,
  },
  {
    name: 'company workspace missing navigation',
    run: runCompanyWorkspaceMissingNavigationTests,
  },
  {
    name: 'company switcher navigation',
    run: runCompanySwitcherNavigationTests,
  },
  {
    name: 'global routes and settings',
    run: runGlobalRoutesAndSettingsTests,
  },
  {
    name: 'assessment workspace navigation',
    run: runAssessmentWorkspaceNavigationTests,
  },
  {
    name: 'assessment workspace filters',
    run: runAssessmentWorkspaceFilterTests,
  },
  {
    name: 'assessment workspace overview actions',
    run: runAssessmentWorkspaceOverviewActionTests,
  },
  {
    name: 'assessment workspace reports and missing states',
    run: runAssessmentWorkspaceReportsAndMissingTests,
  },
  {
    name: 'report details and fallback routes',
    run: runReportDetailsAndFallbackRouteTests,
  },
];

describe('appRouter', () => {
  for (const { name, run } of routerWorkflowChecks) {
    it(name, run, 60_000);
  }
});

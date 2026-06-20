import { runCompaniesEmptySearchAndErrorStateTests } from './pageStatePatterns.tests/companiesEmptySearchAndErrors';
import { runCompaniesFocusAndRowSelectionTests } from './pageStatePatterns.tests/companiesFocusAndRowSelection';
import { runAssessmentsPageStateTests } from './pageStatePatterns.tests/assessmentsPageState';
import { runThreatsPageStateTests } from './pageStatePatterns.tests/threatsPageState';
import { runDashboardRecentCompaniesStateTests } from './pageStatePatterns.tests/dashboardRecentCompaniesState';

await (async () => {
  await runCompaniesEmptySearchAndErrorStateTests();
  await runCompaniesFocusAndRowSelectionTests();
  await runAssessmentsPageStateTests();
  await runThreatsPageStateTests();
  await runDashboardRecentCompaniesStateTests();

  console.log('page state checks passed');
})();

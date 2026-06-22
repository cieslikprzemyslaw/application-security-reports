import { createAssessmentsRouteIntegrationHarness } from './assessments.route.integration.test/support.js';
import { runAssessmentsRouteIntegrationCases } from './assessments.route.integration.test/flow.cases.js';

const harness = await createAssessmentsRouteIntegrationHarness();

try {
  await runAssessmentsRouteIntegrationCases(harness);
} finally {
  await harness.cleanup();
}

console.log('assessments API integration checks passed');

import { createReportsRouteIntegrationHarness } from './reports.route.integration.test/support.js';
import { runReportsRouteIntegrationCases } from './reports.route.integration.test/flow.cases.js';

const harness = await createReportsRouteIntegrationHarness();

try {
  await runReportsRouteIntegrationCases(harness);
} finally {
  await harness.cleanup();
}

console.log('reports API integration checks passed');

import { createThreatsRouteIntegrationHarness } from './threats.route.integration.test/support.js';
import { runThreatsRouteIntegrationCases } from './threats.route.integration.test/flow.cases.js';

const harness = await createThreatsRouteIntegrationHarness();

try {
  await runThreatsRouteIntegrationCases(harness);
} finally {
  await harness.cleanup();
}

console.log('threats API integration checks passed');

import { runEvidenceRouteIntegrationCases } from './evidence.route.integration.test/flow.cases.js';
import { createEvidenceRouteIntegrationHarness } from './evidence.route.integration.test/support.js';

const harness = await createEvidenceRouteIntegrationHarness();

try {
  await runEvidenceRouteIntegrationCases(harness);
} finally {
  await harness.cleanup();
}

console.log('evidence API integration checks passed');

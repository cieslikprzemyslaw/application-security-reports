import { runEvidenceRouteCreateValidationCases } from './evidence.route.test/create-validation.cases.js';
import { runEvidenceRouteReadListCases } from './evidence.route.test/read-list.cases.js';
import { runEvidenceRouteUpdateDeleteCases } from './evidence.route.test/update-delete.cases.js';
import { runEvidenceRouteUpdateValidationCases } from './evidence.route.test/update-validation.cases.js';

await runEvidenceRouteReadListCases();
await runEvidenceRouteUpdateValidationCases();
await runEvidenceRouteCreateValidationCases();
await runEvidenceRouteUpdateDeleteCases();

console.log('evidence API route checks passed');

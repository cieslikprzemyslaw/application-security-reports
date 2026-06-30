import { runEvidenceRouteCreateValidationCases } from './evidence.route.test/create-validation.cases.js';
import { runEvidenceRouteDeleteCases } from './evidence.route.test/delete.cases.js';
import { runEvidenceRouteReadErrorCases } from './evidence.route.test/read-error.cases.js';
import { runEvidenceRouteReadListCases } from './evidence.route.test/read-list.cases.js';
import { runEvidenceRouteUpdateCases } from './evidence.route.test/update.cases.js';
import { runEvidenceRouteUpdateValidationCases } from './evidence.route.test/update-validation.cases.js';

await runEvidenceRouteReadListCases();
await runEvidenceRouteUpdateValidationCases();
await runEvidenceRouteCreateValidationCases();
await runEvidenceRouteUpdateCases();
await runEvidenceRouteDeleteCases();
await runEvidenceRouteReadErrorCases();

console.log('evidence API route checks passed');

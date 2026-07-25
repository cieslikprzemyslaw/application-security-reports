import { runSettingsReadCases } from './settings.route.test/read.cases.js';
import { runSettingsUpdateCases } from './settings.route.test/update.cases.js';

await runSettingsReadCases();
await runSettingsUpdateCases();

console.log('settings API route checks passed');

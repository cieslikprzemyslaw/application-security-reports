import assert from 'node:assert/strict';

import { routePatterns, routes } from './index.js';

assert.equal(routes.dashboard, '/');
assert.equal(routes.companies, '/companies');
assert.equal(routes.assessments, '/assessments');
assert.equal(routes.threats, '/threats');
assert.equal(routes.reports, '/reports');
assert.equal(routes.settings, '/settings');

assert.equal(routePatterns.assessmentDetails, '/assessments/:assessmentId');
assert.equal(routePatterns.reportDetails, '/reports/:reportId');

assert.equal(routes.assessmentDetails('asm_123'), '/assessments/asm_123');
assert.equal(routes.reportDetails('rpt_123'), '/reports/rpt_123');
assert.equal(routes.assessmentDetails('asm 123'), '/assessments/asm%20123');
assert.throws(() => routes.assessmentDetails('   '), /non-empty id/);
assert.throws(() => routes.reportDetails(''), /non-empty id/);

console.log('route configuration checks passed');

import assert from 'node:assert/strict';

import { routePatterns, routes } from './index.js';

assert.equal(routePatterns.root, '/');
assert.equal(routes.root, '/');
assert.equal(routes.dashboard, '/dashboard');
assert.equal(routes.companies, '/companies');
assert.equal(routePatterns.companyWorkspace, '/companies/:companyId');
assert.equal(
  routePatterns.companyWorkspaceOverview,
  '/companies/:companyId/overview',
);
assert.equal(
  routePatterns.companyWorkspaceAssessments,
  '/companies/:companyId/assessments',
);
assert.equal(
  routePatterns.companyWorkspaceReports,
  '/companies/:companyId/reports',
);
assert.equal(
  routePatterns.companyWorkspaceActivity,
  '/companies/:companyId/activity',
);
assert.equal(routes.assessments, '/assessments');
assert.equal(routes.threats, '/threats');
assert.equal(routes.reports, '/reports');
assert.equal(routes.settings, '/settings');
assert.equal(routes.companyWorkspace('cmp_123'), '/companies/cmp_123');
assert.equal(
  routes.companyWorkspaceOverview('cmp_123'),
  '/companies/cmp_123/overview',
);
assert.equal(
  routes.companyWorkspaceAssessments('cmp_123'),
  '/companies/cmp_123/assessments',
);
assert.equal(
  routes.companyWorkspaceReports('cmp_123'),
  '/companies/cmp_123/reports',
);
assert.equal(
  routes.companyWorkspaceActivity('cmp_123'),
  '/companies/cmp_123/activity',
);

assert.equal(routePatterns.assessmentDetails, '/assessments/:assessmentId');
assert.equal(routePatterns.reportDetails, '/reports/:reportId');

assert.equal(routes.assessmentDetails('asm_123'), '/assessments/asm_123');
assert.equal(routes.reportDetails('rpt_123'), '/reports/rpt_123');
assert.equal(routes.assessmentDetails('asm 123'), '/assessments/asm%20123');
assert.throws(() => routes.assessmentDetails('   '), /non-empty id/);
assert.throws(() => routes.reportDetails(''), /non-empty id/);

console.log('route configuration checks passed');

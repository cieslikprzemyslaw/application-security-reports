import { describe, it } from 'vitest';

import assert from 'node:assert/strict';

import { routePatterns, routes } from './index.js';

describe('routes', () => {
  it('passes the migrated checks', async () => {
    assert.equal(routePatterns.root, '/');
    assert.equal(routes.root, '/');
    assert.equal(routes.dashboard, '/dashboard');
    assert.equal(routes.companies, '/companies');
    assert.equal(routePatterns.companiesNew, '/companies/new');
    assert.equal(routes.companiesNew, '/companies/new');
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
      routePatterns.companyWorkspaceReportsPreview,
      '/companies/:companyId/reports/preview',
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
      routes.companyWorkspaceReportsPreview('cmp_123'),
      '/companies/cmp_123/reports/preview',
    );
    assert.equal(
      routes.companyWorkspaceActivity('cmp_123'),
      '/companies/cmp_123/activity',
    );

    assert.equal(
      routePatterns.assessmentDetails,
      '/companies/:companyId/assessments/:assessmentId',
    );
    assert.equal(
      routePatterns.assessmentDetailsOverview,
      '/companies/:companyId/assessments/:assessmentId/overview',
    );
    assert.equal(
      routePatterns.assessmentDetailsFindings,
      '/companies/:companyId/assessments/:assessmentId/findings',
    );
    assert.equal(
      routePatterns.assessmentDetailsEvidence,
      '/companies/:companyId/assessments/:assessmentId/evidence',
    );
    assert.equal(
      routePatterns.assessmentDetailsReports,
      '/companies/:companyId/assessments/:assessmentId/reports',
    );
    assert.equal(
      routePatterns.assessmentDetailsHistory,
      '/companies/:companyId/assessments/:assessmentId/history',
    );
    assert.equal(
      routePatterns.reportDetails,
      '/companies/:companyId/reports/:reportId',
    );

    assert.equal(
      routes.assessmentDetails('cmp_123', 'asm_123'),
      '/companies/cmp_123/assessments/asm_123',
    );
    assert.equal(
      routes.assessmentDetailsOverview('cmp_123', 'asm_123'),
      '/companies/cmp_123/assessments/asm_123/overview',
    );
    assert.equal(
      routes.assessmentDetailsFindings('cmp_123', 'asm_123'),
      '/companies/cmp_123/assessments/asm_123/findings',
    );
    assert.equal(
      routes.assessmentDetailsEvidence('cmp_123', 'asm_123'),
      '/companies/cmp_123/assessments/asm_123/evidence',
    );
    assert.equal(
      routes.assessmentDetailsReports('cmp_123', 'asm_123'),
      '/companies/cmp_123/assessments/asm_123/reports',
    );
    assert.equal(
      routes.assessmentDetailsHistory('cmp_123', 'asm_123'),
      '/companies/cmp_123/assessments/asm_123/history',
    );
    assert.equal(
      routes.reportDetails('cmp_123', 'rpt_123'),
      '/companies/cmp_123/reports/rpt_123',
    );
    assert.equal(
      routes.reportDetailsVersion('cmp_123', 'rpt_123', 'rvs_123'),
      '/companies/cmp_123/reports/rpt_123?versionId=rvs_123',
    );
    assert.equal(
      routes.reportDetailsVersion('cmp 123', 'rpt 123', 'rvs 123'),
      '/companies/cmp%20123/reports/rpt%20123?versionId=rvs+123',
    );
    assert.equal(
      routes.assessmentDetails('cmp 123', 'asm 123'),
      '/companies/cmp%20123/assessments/asm%20123',
    );
    assert.throws(
      () => routes.assessmentDetails('   ', 'asm_123'),
      /non-empty id/,
    );
    assert.throws(
      () => routes.assessmentDetails('cmp_123', '   '),
      /non-empty id/,
    );
    assert.throws(() => routes.reportDetails('', 'rpt_123'), /non-empty id/);
    assert.throws(() => routes.reportDetails('cmp_123', ''), /non-empty id/);
    assert.throws(
      () => routes.reportDetailsVersion('cmp_123', 'rpt_123', '   '),
      /non-empty id/,
    );

    console.log('route configuration checks passed');
  });
});

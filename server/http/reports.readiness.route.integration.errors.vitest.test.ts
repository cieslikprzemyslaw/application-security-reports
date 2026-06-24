import { describe, expect, it } from 'vitest';

import {
  createReportsApp,
  createReportsRouteIntegrationHarness,
  startTestServer,
} from './reports.route.integration.test/support.js';
import {
  buildRequest,
  postReadiness,
} from './reports.readiness.route.integration.test/support.js';

describe('report readiness validation integration', () => {
  it('rejects cross-company selections before readiness classification', async () => {
    const harness = await createReportsRouteIntegrationHarness();
    const server = await startTestServer(
      createReportsApp(
        harness.reportRepository,
        harness.assessmentRepository,
        harness.companyRepository,
        harness.threatRepository,
        harness.evidenceRepository,
        harness.settingsRepository,
      ),
    );

    try {
      const otherCompany = await harness.prisma.company.create({
        data: {
          id: 'cmp_00000000-0000-0000-0000-000000000099',
          name: 'Other Company',
        },
      });
      const request = buildRequest(harness);

      const response = await postReadiness(server.baseUrl, harness.report.id, {
        ...request,
        companyId: otherCompany.id,
      });

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: { code: 'VALIDATION_ERROR' },
      });
    } finally {
      await server.close();
      await harness.cleanup();
    }
  });

  it('returns resource-specific missing selection errors', async () => {
    const harness = await createReportsRouteIntegrationHarness();
    const server = await startTestServer(
      createReportsApp(
        harness.reportRepository,
        harness.assessmentRepository,
        harness.companyRepository,
        harness.threatRepository,
        harness.evidenceRepository,
        harness.settingsRepository,
      ),
    );
    const request = buildRequest(harness);

    try {
      const response = await postReadiness(server.baseUrl, harness.report.id, {
        ...request,
        selection: {
          ...request.selection,
          threatIds: ['thr_00000000-0000-0000-0000-000000000098'],
        },
      });

      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({
        error: { code: 'THREAT_NOT_FOUND' },
      });
    } finally {
      await server.close();
      await harness.cleanup();
    }
  });

  it('rejects an archived Report without creating a version', async () => {
    const harness = await createReportsRouteIntegrationHarness();
    const server = await startTestServer(
      createReportsApp(
        harness.reportRepository,
        harness.assessmentRepository,
        harness.companyRepository,
        harness.threatRepository,
        harness.evidenceRepository,
        harness.settingsRepository,
      ),
    );

    try {
      await harness.prisma.report.update({
        where: { id: harness.report.id },
        data: { status: 'archived' },
      });

      const versionsBefore = await harness.prisma.reportVersion.count({
        where: { reportId: harness.report.id },
      });

      const response = await postReadiness(
        server.baseUrl,
        harness.report.id,
        buildRequest(harness),
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: {
          code: 'VALIDATION_ERROR',
          details: [{ path: 'status' }],
        },
      });

      expect(
        await harness.prisma.reportVersion.count({
          where: { reportId: harness.report.id },
        }),
      ).toBe(versionsBefore);
    } finally {
      await server.close();
      await harness.cleanup();
    }
  });
  it('rejects archived Companies and Assessments', async () => {
    const companyHarness = await createReportsRouteIntegrationHarness();
    const companyServer = await startTestServer(
      createReportsApp(
        companyHarness.reportRepository,
        companyHarness.assessmentRepository,
        companyHarness.companyRepository,
        companyHarness.threatRepository,
        companyHarness.evidenceRepository,
        companyHarness.settingsRepository,
      ),
    );

    try {
      await companyHarness.prisma.company.update({
        where: { id: companyHarness.company.id },
        data: { archivedAt: new Date('2026-06-24T12:00:00.000Z') },
      });

      const response = await postReadiness(
        companyServer.baseUrl,
        companyHarness.report.id,
        buildRequest(companyHarness),
      );
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: {
          code: 'VALIDATION_ERROR',
          details: [{ path: 'companyId' }],
        },
      });
    } finally {
      await companyServer.close();
      await companyHarness.cleanup();
    }

    const assessmentHarness = await createReportsRouteIntegrationHarness();
    const assessmentServer = await startTestServer(
      createReportsApp(
        assessmentHarness.reportRepository,
        assessmentHarness.assessmentRepository,
        assessmentHarness.companyRepository,
        assessmentHarness.threatRepository,
        assessmentHarness.evidenceRepository,
        assessmentHarness.settingsRepository,
      ),
    );

    try {
      await assessmentHarness.prisma.assessment.update({
        where: { id: assessmentHarness.assessment.id },
        data: { status: 'archived' },
      });

      const response = await postReadiness(
        assessmentServer.baseUrl,
        assessmentHarness.report.id,
        buildRequest(assessmentHarness),
      );
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: {
          code: 'VALIDATION_ERROR',
          details: [{ path: 'assessmentId' }],
        },
      });
    } finally {
      await assessmentServer.close();
      await assessmentHarness.cleanup();
    }
  });

  it('rejects branding modes that are not allowed by Settings', async () => {
    const harness = await createReportsRouteIntegrationHarness();
    const server = await startTestServer(
      createReportsApp(
        harness.reportRepository,
        harness.assessmentRepository,
        harness.companyRepository,
        harness.threatRepository,
        harness.evidenceRepository,
        harness.settingsRepository,
      ),
    );
    const request = buildRequest(harness);

    try {
      const response = await postReadiness(server.baseUrl, harness.report.id, {
        ...request,
        brandingMode: 'none',
      });

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: {
          code: 'VALIDATION_ERROR',
          details: [{ path: 'brandingMode' }],
        },
      });
    } finally {
      await server.close();
      await harness.cleanup();
    }
  });
});

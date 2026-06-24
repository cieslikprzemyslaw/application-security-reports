import { describe, expect, it } from 'vitest';

import {
  reportReadinessResultSchema,
  reportVersionResponseSchema,
} from '../../src/domain/schemas/index.js';
import {
  createReportsApp,
  createReportsRouteIntegrationHarness,
  startTestServer,
} from './reports.route.integration.test/support.js';

const buildRequest = (harness: {
  company: { id: string };
  assessment: { id: string };
  threatB: { id: string };
  evidenceRequest: { id: string };
}) => ({
  companyId: harness.company.id,
  assessmentId: harness.assessment.id,
  selection: {
    threatIds: [harness.threatB.id],
    evidenceIds: [harness.evidenceRequest.id],
  },
  configuration: {
    methodology: 'OWASP ASVS / WSTG',
    reportStyle: 'Technical',
    includeEvidence: true,
  },
  brandingMode: 'issuer' as const,
});

const postReadiness = (baseUrl: string, reportId: string, request: unknown) =>
  fetch(`${baseUrl}/api/reports/${reportId}/readiness`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

const postDraft = (baseUrl: string, reportId: string, request: unknown) =>
  fetch(`${baseUrl}/api/reports/${reportId}/versions/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

describe('report readiness production integration', () => {
  it('returns complete readiness through production composition without persistence', async () => {
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
      await harness.prisma.threat.update({
        where: { id: harness.threatB.id },
        data: {
          impact: 'Stack traces disclose internal implementation data.',
        },
      });
      const reportsBefore = await harness.prisma.report.count();
      const versionsBefore = await harness.prisma.reportVersion.count();
      const reportBefore = await harness.prisma.report.findUniqueOrThrow({
        where: { id: harness.report.id },
      });

      const response = await postReadiness(
        server.baseUrl,
        harness.report.id,
        buildRequest(harness),
      );

      expect(response.status).toBe(200);
      const body = (await response.json()) as { data: unknown };
      expect(reportReadinessResultSchema.parse(body.data)).toEqual({
        errors: [],
        warnings: [],
      });
      expect(await harness.prisma.report.count()).toBe(reportsBefore);
      expect(await harness.prisma.reportVersion.count()).toBe(versionsBefore);
      expect(
        await harness.prisma.report.findUniqueOrThrow({
          where: { id: harness.report.id },
        }),
      ).toEqual(reportBefore);
    } finally {
      await server.close();
      await harness.cleanup();
    }
  });

  it('returns warning-only readiness when Evidence is enabled but not selected', async () => {
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
      await harness.prisma.threat.update({
        where: { id: harness.threatB.id },
        data: {
          impact: 'Stack traces disclose internal implementation data.',
        },
      });
      const request = buildRequest(harness);

      const response = await postReadiness(server.baseUrl, harness.report.id, {
        ...request,
        selection: {
          threatIds: request.selection.threatIds,
          evidenceIds: [],
        },
      });

      expect(response.status).toBe(200);
      const body = (await response.json()) as { data: unknown };
      const readiness = reportReadinessResultSchema.parse(body.data);
      expect(readiness.errors).toEqual([]);
      expect(readiness.warnings.map(item => item.code)).toEqual([
        'EVIDENCE_SELECTION_EMPTY',
        'THREAT_EVIDENCE_MISSING',
      ]);
    } finally {
      await server.close();
      await harness.cleanup();
    }
  });

  it('reports blocking readiness while the same incomplete input remains saveable as a draft', async () => {
    const harness = await createReportsRouteIntegrationHarness();
    const server = await startTestServer(
      createReportsApp(
        harness.reportRepository,
        harness.assessmentRepository,
        harness.companyRepository,
        harness.threatRepository,
        harness.evidenceRepository,
        harness.settingsRepository,
        harness.reportVersionRepository,
      ),
    );
    const request = buildRequest(harness);

    try {
      const readinessResponse = await postReadiness(
        server.baseUrl,
        harness.report.id,
        request,
      );

      expect(readinessResponse.status).toBe(200);
      const readinessBody = (await readinessResponse.json()) as {
        data: unknown;
      };
      const readiness = reportReadinessResultSchema.parse(readinessBody.data);
      expect(readiness.errors.map(item => item.code)).toEqual([
        'THREAT_IMPACT_REQUIRED',
      ]);
      expect(
        await harness.prisma.reportVersion.count({
          where: { reportId: harness.report.id },
        }),
      ).toBe(0);

      const draftResponse = await postDraft(
        server.baseUrl,
        harness.report.id,
        request,
      );

      expect(draftResponse.status).toBe(201);
      const draftBody = (await draftResponse.json()) as { data: unknown };
      expect(reportVersionResponseSchema.parse(draftBody.data).status).toBe(
        'draft',
      );
      expect(
        await harness.prisma.reportVersion.count({
          where: { reportId: harness.report.id },
        }),
      ).toBe(1);
    } finally {
      await server.close();
      await harness.cleanup();
    }
  });

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

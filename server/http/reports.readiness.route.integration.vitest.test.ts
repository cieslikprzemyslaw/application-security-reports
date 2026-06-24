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
import {
  buildRequest,
  postDraft,
  postReadiness,
} from './reports.readiness.route.integration.test/support.js';

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
});

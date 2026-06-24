import { describe, expect, it } from 'vitest';

import type { CreateFinalReportVersionRequest } from '../../src/domain/report.js';
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
  threatA: { id: string };
}): CreateFinalReportVersionRequest => ({
  companyId: harness.company.id,
  assessmentId: harness.assessment.id,
  expectedLatestVersion: 0,
  selection: {
    threatIds: [harness.threatA.id],
    evidenceIds: [],
  },
  configuration: {
    methodology: 'OWASP ASVS / WSTG',
    reportStyle: 'Technical',
    includeEvidence: false,
  },
  brandingMode: 'issuer',
});

const postFinal = (baseUrl: string, reportId: string, request: unknown) =>
  fetch(`${baseUrl}/api/reports/${reportId}/versions/final`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

const startHarnessServer = async () => {
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

  return { harness, server };
};

describe('final ReportVersion route production integration', () => {
  it('creates a ready final version and updates the parent Report', async () => {
    const { harness, server } = await startHarnessServer();
    const request = buildRequest(harness);

    try {
      const response = await postFinal(
        server.baseUrl,
        harness.report.id,
        request,
      );

      expect(response.status).toBe(201);
      const body = (await response.json()) as { data: unknown };
      const version = reportVersionResponseSchema.parse(body.data);

      expect(version).toMatchObject({
        reportId: harness.report.id,
        version: 10,
        status: 'final',
      });
      expect(version.snapshot.selection).toEqual(request.selection);
      expect(
        (
          await harness.prisma.report.findUniqueOrThrow({
            where: { id: harness.report.id },
          })
        ).latestVersion,
      ).toBe(10);
    } finally {
      await server.close();
      await harness.cleanup();
    }
  });

  it('creates a warning-only final version', async () => {
    const { harness, server } = await startHarnessServer();
    const request = {
      ...buildRequest(harness),
      configuration: {
        methodology: 'OWASP ASVS / WSTG',
        reportStyle: 'Technical',
        includeEvidence: true,
      },
    } satisfies CreateFinalReportVersionRequest;

    try {
      const response = await postFinal(
        server.baseUrl,
        harness.report.id,
        request,
      );

      expect(response.status).toBe(201);
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

  it('returns blocked readiness without creating a partial version', async () => {
    const { harness, server } = await startHarnessServer();
    const request: CreateFinalReportVersionRequest = {
      ...buildRequest(harness),
      selection: {
        threatIds: [harness.threatB.id],
        evidenceIds: [],
      },
    };

    try {
      const response = await postFinal(
        server.baseUrl,
        harness.report.id,
        request,
      );

      expect(response.status).toBe(409);
      const body = (await response.json()) as {
        error: { code: string };
        readiness: unknown;
      };
      const readiness = reportReadinessResultSchema.parse(body.readiness);

      expect(body.error.code).toBe('REPORT_FINALISATION_BLOCKED');
      expect(readiness.errors.map(item => item.code)).toContain(
        'THREAT_IMPACT_REQUIRED',
      );
      expect(
        await harness.prisma.reportVersion.count({
          where: { reportId: harness.report.id },
        }),
      ).toBe(0);
      expect(
        (
          await harness.prisma.report.findUniqueOrThrow({
            where: { id: harness.report.id },
          })
        ).latestVersion,
      ).toBe(0);
    } finally {
      await server.close();
      await harness.cleanup();
    }
  });

  it('rejects a stale expectedLatestVersion without creating the next major', async () => {
    const { harness, server } = await startHarnessServer();
    const request = buildRequest(harness);

    try {
      const first = await postFinal(server.baseUrl, harness.report.id, request);
      expect(first.status).toBe(201);

      const stale = await postFinal(server.baseUrl, harness.report.id, request);
      expect(stale.status).toBe(409);
      expect(await stale.json()).toMatchObject({
        error: { code: 'REPORT_VERSION_CONFLICT' },
      });

      const versions = await harness.prisma.reportVersion.findMany({
        where: { reportId: harness.report.id },
        orderBy: { version: 'asc' },
      });
      expect(versions.map((item: { version: number }) => item.version)).toEqual(
        [10],
      );
      expect(
        (
          await harness.prisma.report.findUniqueOrThrow({
            where: { id: harness.report.id },
          })
        ).latestVersion,
      ).toBe(10);
    } finally {
      await server.close();
      await harness.cleanup();
    }
  });

  it('returns stable missing and ownership errors without persistence', async () => {
    const { harness, server } = await startHarnessServer();
    const request = buildRequest(harness);

    try {
      const missing = await postFinal(
        server.baseUrl,
        'rpt_00000000-0000-0000-0000-000000000099',
        request,
      );
      expect(missing.status).toBe(404);
      expect(await missing.json()).toMatchObject({
        error: { code: 'REPORT_NOT_FOUND' },
      });

      const crossAssessment = await postFinal(
        server.baseUrl,
        harness.report.id,
        {
          ...request,
          assessmentId: 'asm_00000000-0000-0000-0000-000000000099',
        },
      );
      expect(crossAssessment.status).toBe(400);
      expect(await crossAssessment.json()).toMatchObject({
        error: {
          code: 'VALIDATION_ERROR',
          details: [{ path: 'assessmentId' }],
        },
      });

      expect(
        await harness.prisma.reportVersion.count({
          where: { reportId: harness.report.id },
        }),
      ).toBe(0);
    } finally {
      await server.close();
      await harness.cleanup();
    }
  });
});

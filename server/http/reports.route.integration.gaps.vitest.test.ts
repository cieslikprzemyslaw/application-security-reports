import assert from 'node:assert/strict';

import { describe, it, vi } from 'vitest';

import { buildReportPreviewSnapshotFixture } from '../test/report-preview.fixture.js';

import {
  createReportsApp,
  createReportsRouteIntegrationHarness,
  startTestServer,
  type ReportsRouteIntegrationHarness,
} from './reports.route.integration.test/support.js';

type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details: Array<{ path?: string; message?: string; code?: string }>;
  };
};

const missingReportId = 'rpt_00000000-0000-0000-0000-000000000099';

const readError = async (response: Response): Promise<ApiErrorBody> =>
  response.json() as Promise<ApiErrorBody>;

const withHarness = async (
  run: (
    harness: ReportsRouteIntegrationHarness & {
      server: Awaited<ReturnType<typeof startTestServer>>;
    },
  ) => Promise<void>,
) => {
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
    await run({ ...harness, server });
  } finally {
    await server.close();
    await harness.cleanup();
  }
};

describe('Report API integration gaps', () => {
  it('lists assessment reports with immutable version summaries', async () => {
    await withHarness(
      async ({ server, report, assessment, reportVersionRepository }) => {
        await reportVersionRepository.create({
          reportId: report.id,
          version: 1,
          status: 'draft',
          generatedAt: '2026-06-25',
          snapshot: buildReportPreviewSnapshotFixture(),
        });

        const response = await fetch(
          `${server.baseUrl}/api/reports?assessmentId=${assessment.id}`,
        );
        assert.equal(response.status, 200);
        const body = (await response.json()) as {
          data: Array<{
            id: string;
            versions: Array<{ id: string; version: number; status: string }>;
          }>;
        };

        assert.equal(body.data[0]?.id, report.id);
        assert.equal(body.data[0]?.versions[0]?.version, 1);
        assert.equal(body.data[0]?.versions[0]?.status, 'draft');
      },
    );
  });

  it('creates a draft Report once with ordered deduplicated Threat links', async () => {
    await withHarness(
      async ({ server, prisma, assessment, threatA, threatB }) => {
        const reportCountBefore = await prisma.report.count();
        const versionCountBefore = await prisma.reportVersion.count();

        const response = await fetch(`${server.baseUrl}/api/reports`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assessmentId: assessment.id,
            title: 'Customer Services Portal Security Report',
            selectedThreatIds: [threatB.id, threatA.id, threatB.id],
            executiveSummary: 'Initial executive summary',
          }),
        });

        assert.equal(response.status, 201);

        const body = (await response.json()) as {
          data: {
            id: string;
            assessmentId: string;
            title: string;
            status: string;
            selectedThreatIds: string[];
            latestVersion: number;
            executiveSummary?: string;
            createdAt: string;
            updatedAt: string;
          };
        };

        assert.match(body.data.id, /^rpt_/);
        assert.equal(
          response.headers.get('location'),
          `/api/reports/${body.data.id}`,
        );
        assert.equal(body.data.assessmentId, assessment.id);
        assert.equal(
          body.data.title,
          'Customer Services Portal Security Report',
        );
        assert.equal(body.data.status, 'draft');
        assert.equal(body.data.latestVersion, 0);
        assert.deepEqual(body.data.selectedThreatIds, [threatB.id, threatA.id]);
        assert.equal(body.data.executiveSummary, 'Initial executive summary');
        assert.equal(Number.isNaN(Date.parse(body.data.createdAt)), false);
        assert.equal(Number.isNaN(Date.parse(body.data.updatedAt)), false);

        assert.equal(await prisma.report.count(), reportCountBefore + 1);
        assert.equal(await prisma.reportVersion.count(), versionCountBefore);

        assert.deepEqual(
          await prisma.reportThreat.findMany({
            where: { reportId: body.data.id },
            orderBy: { position: 'asc' },
            select: { threatId: true, position: true },
          }),
          [
            { threatId: threatB.id, position: 0 },
            { threatId: threatA.id, position: 1 },
          ],
        );
      },
    );
  });

  it('rejects malformed, missing, cross-Assessment, and archived create requests', async () => {
    await withHarness(async ({ server, prisma, assessment, foreignThreat }) => {
      const countBefore = await prisma.report.count();

      const malformed = await fetch(`${server.baseUrl}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId: assessment.id,
          title: 'Malformed',
          selectedThreatIds: [],
          status: 'generated',
        }),
      });

      assert.equal(malformed.status, 400);
      assert.equal((await readError(malformed)).error.code, 'VALIDATION_ERROR');
      assert.equal(await prisma.report.count(), countBefore);

      const missingAssessment = await fetch(`${server.baseUrl}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId: 'asm_00000000-0000-0000-0000-000000000098',
          title: 'Missing Assessment',
          selectedThreatIds: [],
        }),
      });

      assert.equal(missingAssessment.status, 404);
      assert.equal(
        (await readError(missingAssessment)).error.code,
        'ASSESSMENT_NOT_FOUND',
      );
      assert.equal(await prisma.report.count(), countBefore);

      const crossAssessment = await fetch(`${server.baseUrl}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId: assessment.id,
          title: 'Cross Assessment',
          selectedThreatIds: [foreignThreat.id],
        }),
      });

      assert.equal(crossAssessment.status, 400);
      const crossAssessmentError = await readError(crossAssessment);
      assert.equal(crossAssessmentError.error.code, 'VALIDATION_ERROR');
      assert.equal(
        crossAssessmentError.error.details[0]?.path,
        'selectedThreatIds.0',
      );
      assert.equal(await prisma.report.count(), countBefore);

      await prisma.assessment.update({
        where: { id: assessment.id },
        data: { status: 'archived' },
      });

      const archivedAssessment = await fetch(`${server.baseUrl}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId: assessment.id,
          title: 'Archived Assessment',
          selectedThreatIds: [],
        }),
      });

      assert.equal(archivedAssessment.status, 400);
      const archivedError = await readError(archivedAssessment);
      assert.equal(archivedError.error.code, 'VALIDATION_ERROR');
      assert.equal(archivedError.error.details[0]?.path, 'assessmentId');
      assert.equal(await prisma.report.count(), countBefore);
    });
  });

  it('returns safe malformed and missing Report errors', async () => {
    await withHarness(async ({ server, prisma }) => {
      const countBefore = await prisma.report.count();

      const malformedResponse = await fetch(
        `${server.baseUrl}/api/reports/not-a-report-id`,
      );
      assert.equal(malformedResponse.status, 400);
      assert.equal(
        (await readError(malformedResponse)).error.code,
        'VALIDATION_ERROR',
      );

      const missingResponse = await fetch(
        `${server.baseUrl}/api/reports/${missingReportId}`,
      );
      assert.equal(missingResponse.status, 404);
      assert.deepEqual(await readError(missingResponse), {
        error: {
          code: 'REPORT_NOT_FOUND',
          message: 'Report not found',
          details: [],
        },
      });

      assert.equal(await prisma.report.count(), countBefore);
    });
  });

  it('keeps Report data unchanged for unsupported mutation endpoints', async () => {
    await withHarness(async ({ server, prisma, report }) => {
      const before = await prisma.report.findUnique({
        where: { id: report.id },
        include: { selectedThreats: true },
      });

      for (const method of ['POST', 'PATCH', 'DELETE'] as const) {
        const response = await fetch(
          `${server.baseUrl}/api/reports/${report.id}`,
          method === 'DELETE'
            ? { method }
            : {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: 'Must not persist' }),
              },
        );

        assert.equal(response.status, 404);
        const body = await readError(response);
        assert.equal(Array.isArray(body.error.details), true);
      }

      assert.deepEqual(
        await prisma.report.findUnique({
          where: { id: report.id },
          include: { selectedThreats: true },
        }),
        before,
      );
    });
  });

  it('returns a safe error when required Settings are missing', async () => {
    await withHarness(async ({ server, prisma, report }) => {
      await prisma.settings.deleteMany();

      const response = await fetch(
        `${server.baseUrl}/api/reports/${report.id}`,
      );
      const body = await readError(response);

      assert.equal(response.status, 404);
      assert.deepEqual(body, {
        error: {
          code: 'SETTINGS_NOT_FOUND',
          message: 'Settings not found',
          details: [],
        },
      });
      await assert.doesNotReject(async () => {
        assert.notEqual(
          await prisma.report.findUnique({ where: { id: report.id } }),
          null,
        );
      });
    });
  });

  it('does not leak persistence details in an unexpected failure', async () => {
    await withHarness(async ({ server, prisma, report }) => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      try {
        await prisma.$executeRawUnsafe(
          'ALTER TABLE "Report" RENAME TO "ReportUnavailable"',
        );

        const response = await fetch(
          `${server.baseUrl}/api/reports/${report.id}`,
        );
        const body = await readError(response);

        assert.equal(response.status, 500);
        assert.deepEqual(body, {
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Unexpected server error',
            details: [],
          },
        });
        assert.equal(JSON.stringify(body).includes('no such table'), false);
        assert.equal(JSON.stringify(body).includes('ReportUnavailable'), false);
        assert.equal(consoleError.mock.calls.length > 0, true);

        const createResponse = await fetch(`${server.baseUrl}/api/reports`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assessmentId: 'asm_00000000-0000-0000-0000-000000000001',
            title: 'Repository failure',
            selectedThreatIds: [],
          }),
        });
        const createBody = await readError(createResponse);

        assert.equal(createResponse.status, 500);
        assert.deepEqual(createBody, {
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Unexpected server error',
            details: [],
          },
        });
        assert.equal(
          JSON.stringify(createBody).includes('ReportUnavailable'),
          false,
        );
      } finally {
        consoleError.mockRestore();
      }
    });
  });
});

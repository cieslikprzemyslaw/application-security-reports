import assert from 'node:assert/strict';

import { describe, it, vi } from 'vitest';

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
      } finally {
        consoleError.mockRestore();
      }
    });
  });
});

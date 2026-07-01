import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  deleteReportVersionResponseSchema,
  reportVersionResponseSchema,
} from '../../src/domain/schemas/index.js';
import { buildReportPreviewSnapshotFixture } from '../test/report-preview.fixture.js';
import {
  createReportsApp,
  createReportsRouteIntegrationHarness,
  startTestServer,
} from './reports.route.integration.test/support.js';

const listResponseSchema = z.object({
  data: z.array(reportVersionResponseSchema),
});
const singleResponseSchema = z.object({ data: reportVersionResponseSchema });
const deleteResponseSchema = z.object({
  data: deleteReportVersionResponseSchema,
});

describe('ReportVersion read production integration', () => {
  it('lists and reads persisted immutable versions through production API composition', async () => {
    const harness = await createReportsRouteIntegrationHarness();
    const snapshot = buildReportPreviewSnapshotFixture();
    const first = await harness.reportVersionRepository.create({
      reportId: harness.report.id,
      version: 1,
      status: 'draft',
      generatedAt: '2026-06-24',
      filePath: 'C:\\private\\draft.json',
      snapshot,
    });
    const second = await harness.reportVersionRepository.create({
      reportId: harness.report.id,
      version: 10,
      status: 'final',
      generatedAt: '2026-06-25',
      filePath: 'C:\\private\\final.json',
      snapshot,
    });
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

    try {
      const listResponse = await fetch(
        `${server.baseUrl}/api/reports/${harness.report.id}/versions`,
      );
      expect(listResponse.status).toBe(200);
      const listBody = listResponseSchema.parse(await listResponse.json());

      expect(listBody.data.map(version => version.id)).toEqual([
        first.id,
        second.id,
      ]);
      expect(listBody.data.map(version => version.version)).toEqual([1, 10]);
      expect(JSON.stringify(listBody)).not.toContain('private');

      const readResponse = await fetch(
        `${server.baseUrl}/api/reports/${harness.report.id}/versions/${second.id}`,
      );
      expect(readResponse.status).toBe(200);
      const readBody = singleResponseSchema.parse(await readResponse.json());

      expect(readBody.data).toMatchObject({
        id: second.id,
        reportId: harness.report.id,
        version: 10,
        status: 'final',
      });
      expect(readBody.data.snapshot).toEqual(snapshot);
      expect(JSON.stringify(readBody)).not.toContain('private');
    } finally {
      await server.close();
      await harness.cleanup();
    }
  });

  it('deletes a selected final ReportVersion and updates the parent latestVersion', async () => {
    const harness = await createReportsRouteIntegrationHarness();
    const snapshot = buildReportPreviewSnapshotFixture();
    const first = await harness.reportVersionRepository.create({
      reportId: harness.report.id,
      version: 1,
      status: 'draft',
      generatedAt: '2026-06-24',
      snapshot,
    });
    const second = await harness.reportVersionRepository.create({
      reportId: harness.report.id,
      version: 10,
      status: 'final',
      generatedAt: '2026-06-25',
      snapshot,
    });
    await harness.reportRepository.update(harness.report.id, {
      latestVersion: 10,
    });
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

    try {
      const response = await fetch(
        `${server.baseUrl}/api/reports/${harness.report.id}/versions/${second.id}`,
        { method: 'DELETE' },
      );
      expect(response.status).toBe(200);
      const body = deleteResponseSchema.parse(await response.json());

      expect(body.data).toEqual({
        reportId: harness.report.id,
        deletedVersionId: second.id,
        latestVersion: first.version,
      });

      const remainingVersions =
        await harness.reportVersionRepository.findByReportId(harness.report.id);
      expect(remainingVersions.map(version => version.id)).toEqual([first.id]);
      await expect(
        harness.reportVersionRepository.findById(second.id),
      ).resolves.toBeNull();
      await expect(
        harness.reportRepository.findById(harness.report.id),
      ).resolves.toMatchObject({ latestVersion: first.version });
    } finally {
      await server.close();
      await harness.cleanup();
    }
  });

  it('rejects a cross-report nested read without exposing the existing version', async () => {
    const harness = await createReportsRouteIntegrationHarness();
    const version = await harness.reportVersionRepository.create({
      reportId: harness.report.id,
      version: 1,
      status: 'draft',
      generatedAt: '2026-06-25',
      snapshot: buildReportPreviewSnapshotFixture(),
    });
    const otherReport = await harness.prisma.report.create({
      data: {
        id: 'rpt_00000000-0000-0000-0000-000000000099',
        assessmentId: harness.assessment.id,
        title: 'Other report',
        status: 'draft',
      },
    });
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

    try {
      const response = await fetch(
        `${server.baseUrl}/api/reports/${otherReport.id}/versions/${version.id}`,
      );
      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({
        error: { code: 'REPORT_VERSION_NOT_FOUND' },
      });
    } finally {
      await server.close();
      await harness.cleanup();
    }
  });
});

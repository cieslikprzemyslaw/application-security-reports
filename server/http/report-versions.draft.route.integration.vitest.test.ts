import { describe, expect, it } from 'vitest';

import type { ReportVersionRepository } from '../database/repositories/reportVersion.repository.js';
import {
  reportPreviewSnapshotSchema,
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

const postDraft = (baseUrl: string, reportId: string, request: unknown) =>
  fetch(`${baseUrl}/api/reports/${reportId}/versions/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

describe('draft ReportVersion production integration', () => {
  it('persists consecutive immutable snapshots and updates latestVersion atomically', async () => {
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
      const firstResponse = await postDraft(
        server.baseUrl,
        harness.report.id,
        request,
      );
      expect(firstResponse.status).toBe(201);
      const firstBody = (await firstResponse.json()) as { data: unknown };
      const first = reportVersionResponseSchema.parse(firstBody.data);

      expect(first.version).toBe(1);
      expect(first.snapshot.selection).toEqual(request.selection);

      await harness.prisma.threat.update({
        where: { id: harness.threatB.id },
        data: { title: 'Changed after first draft' },
      });

      const secondResponse = await postDraft(
        server.baseUrl,
        harness.report.id,
        request,
      );
      expect(secondResponse.status).toBe(201);
      const secondBody = (await secondResponse.json()) as { data: unknown };
      const second = reportVersionResponseSchema.parse(secondBody.data);

      expect(second.version).toBe(2);
      expect(second.snapshot.selectedThreats[0]?.title).toBe(
        'Changed after first draft',
      );

      const persisted = await harness.prisma.reportVersion.findMany({
        where: { reportId: harness.report.id },
        orderBy: { version: 'asc' },
      });
      expect(
        persisted.map((item: { version: number }) => item.version),
      ).toEqual([1, 2]);
      expect(
        reportPreviewSnapshotSchema.parse(persisted[0]?.snapshot)
          .selectedThreats[0]?.title,
      ).not.toBe('Changed after first draft');

      const parent = await harness.prisma.report.findUniqueOrThrow({
        where: { id: harness.report.id },
      });
      expect(parent.latestVersion).toBe(2);
    } finally {
      await server.close();
      await harness.cleanup();
    }
  });

  it('leaves persistence unchanged when the draft minor sequence is exhausted', async () => {
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
      for (let index = 0; index < 9; index += 1) {
        const response = await postDraft(
          server.baseUrl,
          harness.report.id,
          request,
        );
        expect(response.status).toBe(201);
      }

      const versionsBefore = await harness.prisma.reportVersion.count({
        where: { reportId: harness.report.id },
      });
      const reportBefore = await harness.prisma.report.findUniqueOrThrow({
        where: { id: harness.report.id },
      });

      const rejected = await postDraft(
        server.baseUrl,
        harness.report.id,
        request,
      );

      expect(rejected.status).toBe(409);
      expect(await rejected.json()).toMatchObject({
        error: { code: 'REPORT_VERSION_SEQUENCE_EXHAUSTED' },
      });
      expect(
        await harness.prisma.reportVersion.count({
          where: { reportId: harness.report.id },
        }),
      ).toBe(versionsBefore);
      expect(
        (
          await harness.prisma.report.findUniqueOrThrow({
            where: { id: harness.report.id },
          })
        ).latestVersion,
      ).toBe(reportBefore.latestVersion);
    } finally {
      await server.close();
      await harness.cleanup();
    }
  });
  it('rolls back the created version when the parent Report update fails', async () => {
    const harness = await createReportsRouteIntegrationHarness();
    const failingRepository: ReportVersionRepository = {
      ...harness.reportVersionRepository,
      withTransaction: operation =>
        harness.reportVersionRepository.withTransaction(repository =>
          operation({
            ...repository,
            updateReportLatestVersion: async () => {
              throw new Error('forced latestVersion update failure');
            },
          }),
        ),
    };
    const server = await startTestServer(
      createReportsApp(
        harness.reportRepository,
        harness.assessmentRepository,
        harness.companyRepository,
        harness.threatRepository,
        harness.evidenceRepository,
        harness.settingsRepository,
        failingRepository,
      ),
    );
    const request = buildRequest(harness);

    try {
      const reportBefore = await harness.prisma.report.findUniqueOrThrow({
        where: { id: harness.report.id },
      });

      const response = await postDraft(
        server.baseUrl,
        harness.report.id,
        request,
      );

      expect(response.status).toBe(500);
      expect(await response.json()).toMatchObject({
        error: { code: 'INTERNAL_SERVER_ERROR' },
      });
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
      ).toBe(reportBefore.latestVersion);
    } finally {
      await server.close();
      await harness.cleanup();
    }
  });
});

import { describe, expect, it } from 'vitest';

import type { ReportPreviewRequest } from '../../src/domain/report-preview.js';
import type { ReportVersionRepository } from '../database/repositories/reportVersion.repository.js';
import { createReportsRouteIntegrationHarness } from '../http/reports.route.integration.test/support.js';
import { finaliseReportVersion } from './report-version-finalisation.service.js';

const buildRequest = (harness: {
  company: { id: string };
  assessment: { id: string };
  threatA: { id: string };
}): ReportPreviewRequest => ({
  companyId: harness.company.id,
  assessmentId: harness.assessment.id,
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

describe('final ReportVersion production integration', () => {
  it('creates consecutive immutable final snapshots and updates latestVersion atomically', async () => {
    const harness = await createReportsRouteIntegrationHarness();
    const request = buildRequest(harness);

    try {
      const first = await finaliseReportVersion(
        {
          reportId: harness.report.id,
          request,
          baseUrl: 'http://localhost:3001',
        },
        {
          reportVersionRepository: harness.reportVersionRepository,
          now: () => new Date('2026-06-24T19:00:00.000Z'),
        },
      );

      expect(first).toMatchObject({
        status: 'created',
        reportVersion: { version: 10, status: 'final' },
      });

      await harness.prisma.threat.update({
        where: { id: harness.threatA.id },
        data: { title: 'Changed after first final' },
      });

      const second = await finaliseReportVersion(
        {
          reportId: harness.report.id,
          request,
          baseUrl: 'http://localhost:3001',
        },
        {
          reportVersionRepository: harness.reportVersionRepository,
          now: () => new Date('2026-06-25T08:00:00.000Z'),
        },
      );

      expect(second).toMatchObject({
        status: 'created',
        reportVersion: { version: 20, status: 'final' },
      });

      const versions = await harness.reportVersionRepository.findByReportId(
        harness.report.id,
      );
      expect(versions.map(version => version.version)).toEqual([10, 20]);
      expect(versions[0]?.snapshot.selectedThreats[0]?.title).toBe(
        'Missing Server-Side Authorization',
      );
      expect(versions[1]?.snapshot.selectedThreats[0]?.title).toBe(
        'Changed after first final',
      );
      expect(
        (
          await harness.prisma.report.findUniqueOrThrow({
            where: { id: harness.report.id },
          })
        ).latestVersion,
      ).toBe(20);
    } finally {
      await harness.cleanup();
    }
  });

  it('returns blocking readiness without creating a partial final version', async () => {
    const harness = await createReportsRouteIntegrationHarness();
    const request: ReportPreviewRequest = {
      ...buildRequest(harness),
      selection: {
        threatIds: [harness.threatB.id],
        evidenceIds: [],
      },
    };

    try {
      const result = await finaliseReportVersion(
        {
          reportId: harness.report.id,
          request,
          baseUrl: 'http://localhost:3001',
        },
        { reportVersionRepository: harness.reportVersionRepository },
      );

      expect(result).toMatchObject({
        status: 'blocked',
        readiness: {
          errors: [{ code: 'THREAT_IMPACT_REQUIRED' }],
        },
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
      ).toBe(0);
    } finally {
      await harness.cleanup();
    }
  });

  it('rolls back the final version when the parent Report update fails', async () => {
    const harness = await createReportsRouteIntegrationHarness();
    const request = buildRequest(harness);
    const failingRepository: Pick<
      ReportVersionRepository,
      'withFinalisationTransaction'
    > = {
      withFinalisationTransaction: operation =>
        harness.reportVersionRepository.withFinalisationTransaction(
          repositories =>
            operation({
              ...repositories,
              reportVersionRepository: {
                ...repositories.reportVersionRepository,
                updateReportLatestVersion: async () => {
                  throw new Error('forced latestVersion update failure');
                },
              },
            }),
        ),
    };

    try {
      await expect(
        finaliseReportVersion(
          {
            reportId: harness.report.id,
            request,
            baseUrl: 'http://localhost:3001',
          },
          { reportVersionRepository: failingRepository },
        ),
      ).rejects.toThrow('forced latestVersion update failure');

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
      await harness.cleanup();
    }
  });
});

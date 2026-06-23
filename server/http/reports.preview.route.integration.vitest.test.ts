import { describe, expect, it } from 'vitest';

import { reportPreviewSnapshotSchema } from '../../src/domain/schemas/index.js';
import {
  createReportsApp,
  createReportsRouteIntegrationHarness,
  startTestServer,
} from './reports.route.integration.test/support.js';

describe('POST /api/reports/preview integration', () => {
  it('returns a validated snapshot through production composition without persistence', async () => {
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
      const reportsBefore = await harness.prisma.report.count();
      const versionsBefore = await harness.prisma.reportVersion.count();
      const request = {
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
        brandingMode: 'issuer',
      } as const;

      const response = await fetch(`${server.baseUrl}/api/reports/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(200);
      const body = (await response.json()) as { data: unknown };
      const snapshot = reportPreviewSnapshotSchema.parse(body.data);

      expect(snapshot.selection).toEqual(request.selection);
      expect(snapshot.configuration).toEqual(request.configuration);
      expect(snapshot.branding.issuerLogoUrl).toBe(
        `${server.baseUrl}/api/settings/issuer-logo`,
      );
      expect(await harness.prisma.report.count()).toBe(reportsBefore);
      expect(await harness.prisma.reportVersion.count()).toBe(versionsBefore);
    } finally {
      await server.close();
      await harness.cleanup();
    }
  });
});

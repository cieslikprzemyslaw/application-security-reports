import { describe, expect, it } from 'vitest';

import { reportPreviewSnapshotSchema } from '../../src/domain/schemas/index.js';
import {
  company,
  companyId,
  evidenceId,
  postPreview,
  previewRequest,
  settings,
  startPreviewServer,
  threatId,
} from './reports.preview.route.test/support.js';

describe('POST /api/reports/preview success', () => {
  it('returns the validated snapshot with exact selection and public branding URLs', async () => {
    const server = await startPreviewServer();

    try {
      const response = await postPreview(server.baseUrl);
      expect(response.status).toBe(200);

      const body = (await response.json()) as { data: unknown };
      const snapshot = reportPreviewSnapshotSchema.parse(body.data);

      expect(snapshot.selection).toEqual(previewRequest.selection);
      expect(snapshot.configuration).toEqual(previewRequest.configuration);
      expect(snapshot.selectedThreats.map(item => item.id)).toEqual([threatId]);
      expect(snapshot.selectedEvidence.map(item => item.id)).toEqual([
        evidenceId,
      ]);
      expect(snapshot.company.id).toBe(companyId);
      expect(snapshot.company.logoUrl).toBe(
        `${server.baseUrl}/api/companies/${companyId}/logo`,
      );
      expect(snapshot.branding.companyLogoUrl).toBe(
        `${server.baseUrl}/api/companies/${companyId}/logo`,
      );
      expect(snapshot.branding.issuerLogoUrl).toBe(
        `${server.baseUrl}/api/settings/issuer-logo`,
      );
      expect(JSON.stringify(snapshot)).not.toContain('logo_');
      expect(JSON.stringify(snapshot)).not.toContain('private/evidence.txt');
      expect(JSON.stringify(snapshot)).not.toContain('C:\\private');
      expect(snapshot.warnings).toEqual([]);
    } finally {
      await server.close();
    }
  });

  it('returns null logo URLs when no managed logo references exist', async () => {
    const server = await startPreviewServer({
      company: { ...company, logoUrl: null },
      settings: { ...settings, issuerLogoId: undefined },
    });

    try {
      const response = await postPreview(server.baseUrl);
      const body = (await response.json()) as { data: unknown };
      const snapshot = reportPreviewSnapshotSchema.parse(body.data);

      expect(snapshot.company.logoUrl).toBeNull();
      expect(snapshot.branding.companyLogoUrl).toBeNull();
      expect(snapshot.branding.issuerLogoUrl).toBeNull();
    } finally {
      await server.close();
    }
  });
});

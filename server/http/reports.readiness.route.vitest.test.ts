import { describe, expect, it } from 'vitest';

import { reportReadinessResultSchema } from '../../src/domain/schemas/index.js';
import { RepositoryError } from '../database/errors.js';
import {
  company,
  postReadiness,
  previewRequest,
  report,
  startPreviewServer,
  threat,
} from './reports.preview.route.test/support.js';

const completeThreat = {
  ...threat,
  impact: 'Another customer record can be accessed.',
};

describe('POST /api/reports/:id/readiness', () => {
  it('returns an empty readiness result for complete input', async () => {
    const server = await startPreviewServer({ threat: completeThreat });

    try {
      const response = await postReadiness(server.baseUrl);
      expect(response.status).toBe(200);

      const body = (await response.json()) as { data: unknown };
      expect(reportReadinessResultSchema.parse(body.data)).toEqual({
        errors: [],
        warnings: [],
      });
      expect(server.calls.reportFindById).toHaveBeenCalledWith(report.id);
    } finally {
      await server.close();
    }
  });

  it('returns non-blocking Evidence warnings', async () => {
    const server = await startPreviewServer({ threat: completeThreat });

    try {
      const response = await postReadiness(server.baseUrl, report.id, {
        ...previewRequest,
        selection: {
          threatIds: previewRequest.selection.threatIds,
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
    }
  });

  it('returns blocking Threat readiness errors without rejecting the request', async () => {
    const server = await startPreviewServer();

    try {
      const response = await postReadiness(server.baseUrl);
      expect(response.status).toBe(200);

      const body = (await response.json()) as { data: unknown };
      const readiness = reportReadinessResultSchema.parse(body.data);

      expect(readiness.errors.map(item => item.code)).toEqual([
        'THREAT_IMPACT_REQUIRED',
      ]);
      expect(readiness.warnings).toEqual([]);
    } finally {
      await server.close();
    }
  });

  it('returns REPORT_NOT_FOUND for an unknown Report', async () => {
    const server = await startPreviewServer({ report: null });

    try {
      const response = await postReadiness(server.baseUrl);
      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({
        error: { code: 'REPORT_NOT_FOUND' },
      });
    } finally {
      await server.close();
    }
  });

  it('rejects archived Reports before readiness classification', async () => {
    const server = await startPreviewServer({
      report: {
        ...report,
        status: 'archived',
      },
      threat: completeThreat,
    });

    try {
      const response = await postReadiness(server.baseUrl);

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: {
          code: 'VALIDATION_ERROR',
          details: [
            {
              path: 'status',
              message:
                'Archived Reports are not eligible for readiness validation.',
            },
          ],
        },
      });
      expect(server.calls.companyFindById).not.toHaveBeenCalled();
    } finally {
      await server.close();
    }
  });
  it('rejects a request for a different Assessment than the Report', async () => {
    const server = await startPreviewServer({
      report: {
        ...report,
        assessmentId: 'asm_00000000-0000-0000-0000-000000000099',
      },
      threat: completeThreat,
    });

    try {
      const response = await postReadiness(server.baseUrl);
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: {
          code: 'VALIDATION_ERROR',
          details: [{ path: 'assessmentId' }],
        },
      });
    } finally {
      await server.close();
    }
  });

  it.each([
    [
      'Company',
      () => startPreviewServer({ company: null }),
      'COMPANY_NOT_FOUND',
    ],
    [
      'Assessment',
      () => startPreviewServer({ assessment: null }),
      'ASSESSMENT_NOT_FOUND',
    ],
    ['Threat', () => startPreviewServer({ threat: null }), 'THREAT_NOT_FOUND'],
    [
      'Evidence',
      () => startPreviewServer({ evidence: null }),
      'EVIDENCE_NOT_FOUND',
    ],
    [
      'Settings',
      () => startPreviewServer({ settings: null }),
      'SETTINGS_NOT_FOUND',
    ],
  ] as const)(
    'returns %s missing errors from the shared preview flow',
    async (_name, start, code) => {
      const server = await start();

      try {
        const response = await postReadiness(server.baseUrl);
        expect(response.status).toBe(404);
        expect(await response.json()).toMatchObject({
          error: { code },
        });
      } finally {
        await server.close();
      }
    },
  );

  it('rejects archived Companies with the existing validation envelope', async () => {
    const server = await startPreviewServer({
      company: {
        ...company,
        archivedAt: '2026-06-24T12:00:00.000Z',
      },
      threat: completeThreat,
    });

    try {
      const response = await postReadiness(server.baseUrl);
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: {
          code: 'VALIDATION_ERROR',
          details: [
            {
              path: 'companyId',
              message: 'Archived Companies are not selectable.',
            },
          ],
        },
      });
    } finally {
      await server.close();
    }
  });

  it('returns a safe 500 response for repository failures', async () => {
    const server = await startPreviewServer({
      reportError: new RepositoryError('private database detail'),
    });

    try {
      const response = await postReadiness(server.baseUrl);
      expect(response.status).toBe(500);
      const body = (await response.json()) as {
        error: { code: string; message: string };
      };
      expect(body.error).toEqual(
        expect.objectContaining({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Unexpected server error',
        }),
      );
      expect(JSON.stringify(body)).not.toContain('private database detail');
    } finally {
      await server.close();
    }
  });

  it('validates the Report ID and strict request body before repository access', async () => {
    const server = await startPreviewServer({ threat: completeThreat });

    try {
      const invalidIdResponse = await postReadiness(
        server.baseUrl,
        'rpt_invalid',
      );
      expect(invalidIdResponse.status).toBe(400);

      const invalidBodyResponse = await postReadiness(
        server.baseUrl,
        report.id,
        {
          ...previewRequest,
          snapshot: {},
        },
      );
      expect(invalidBodyResponse.status).toBe(400);
      expect(server.calls.reportFindById).not.toHaveBeenCalled();
    } finally {
      await server.close();
    }
  });
});

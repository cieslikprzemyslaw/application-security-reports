import { describe, expect, it, vi } from 'vitest';

import { RepositoryError } from '../database/errors.js';
import {
  assessment,
  evidence,
  postPreview,
  previewRequest,
  settings,
  threat,
  startPreviewServer,
} from './reports.preview.route.test/support.js';

type ErrorBody = {
  error: {
    code: string;
    message: string;
    details: Array<{ path: string }>;
  };
};

const readError = (response: Response): Promise<ErrorBody> =>
  response.json() as Promise<ErrorBody>;

describe('POST /api/reports/preview errors', () => {
  it('validates the body before repository access', async () => {
    const server = await startPreviewServer();

    try {
      const response = await postPreview(server.baseUrl, {
        ...previewRequest,
        selection: {
          threatIds: [
            previewRequest.selection.threatIds[0],
            previewRequest.selection.threatIds[0],
          ],
          evidenceIds: [],
        },
        unexpected: true,
      });

      expect(response.status).toBe(400);
      expect((await readError(response)).error.code).toBe('VALIDATION_ERROR');
      expect(server.calls.companyFindById).not.toHaveBeenCalled();
      expect(server.calls.settingsGet).not.toHaveBeenCalled();
      expect(server.calls.assessmentFindById).not.toHaveBeenCalled();
    } finally {
      await server.close();
    }
  });

  it.each([
    ['company', { company: null }, 'COMPANY_NOT_FOUND'],
    ['settings', { settings: null }, 'SETTINGS_NOT_FOUND'],
    ['assessment', { assessment: null }, 'ASSESSMENT_NOT_FOUND'],
    ['threat', { threat: null }, 'THREAT_NOT_FOUND'],
    ['evidence', { evidence: null }, 'EVIDENCE_NOT_FOUND'],
  ] as const)(
    'returns a resource-specific error for missing %s',
    async (_name, overrides, code) => {
      const server = await startPreviewServer(overrides);

      try {
        const response = await postPreview(server.baseUrl);
        expect(response.status).toBe(404);
        expect((await readError(response)).error.code).toBe(code);
      } finally {
        await server.close();
      }
    },
  );

  it('rejects cross-company, archived, and disallowed branding selections', async () => {
    const cases = [
      {
        overrides: {
          assessment: {
            ...assessment,
            companyId: 'cmp_00000000-0000-0000-0000-000000000099',
          },
        },
        path: 'companyId',
      },
      {
        overrides: {
          threat: {
            ...threat,
            assessmentId: 'asm_00000000-0000-0000-0000-000000000099',
          },
        },
        path: 'selection.threatIds.0',
      },
      {
        overrides: {
          evidence: {
            ...evidence,
            assessmentId: 'asm_00000000-0000-0000-0000-000000000099',
          },
        },
        path: 'selection.evidenceIds.0',
      },
      {
        overrides: {
          assessment: { ...assessment, status: 'archived' as const },
        },
        path: 'assessmentId',
      },
      {
        overrides: {
          settings: {
            ...settings,
            allowedBrandingModes: ['client'] as Array<'client'>,
          },
        },
        path: 'brandingMode',
      },
    ];

    for (const testCase of cases) {
      const server = await startPreviewServer(testCase.overrides);
      try {
        const response = await postPreview(server.baseUrl);
        const body = await readError(response);
        expect(response.status).toBe(400);
        expect(body.error.code).toBe('VALIDATION_ERROR');
        expect(
          body.error.details.some(item => item.path === testCase.path),
        ).toBe(true);
      } finally {
        await server.close();
      }
    }
  });

  it('returns a safe generic error for repository failures', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const server = await startPreviewServer({
      companyError: new RepositoryError('database path C:\\secret\\db.sqlite'),
    });

    try {
      const response = await postPreview(server.baseUrl);
      const body = await readError(response);
      expect(response.status).toBe(500);
      expect(body).toEqual({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Unexpected server error',
          details: [],
        },
      });
      expect(JSON.stringify(body)).not.toContain('secret');
    } finally {
      consoleError.mockRestore();
      await server.close();
    }
  });
});

import assert from 'node:assert/strict';

import { describe, it, vi } from 'vitest';

import {
  createEvidenceRouteIntegrationHarness,
  type EvidenceRouteIntegrationHarness,
} from './evidence.route.integration.test/support.js';

type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details: Array<{ path?: string; message?: string; code?: string }>;
  };
};

const missingAssessmentId = 'asm_00000000-0000-0000-0000-000000000099';
const missingEvidenceId = 'evd_00000000-0000-0000-0000-000000000099';

const readError = async (response: Response): Promise<ApiErrorBody> =>
  response.json() as Promise<ApiErrorBody>;

const withHarness = async (
  run: (harness: EvidenceRouteIntegrationHarness) => Promise<void>,
) => {
  const harness = await createEvidenceRouteIntegrationHarness();

  try {
    await run(harness);
  } finally {
    await harness.cleanup();
  }
};

describe('Evidence API integration gaps', () => {
  it('returns safe validation and not-found responses without changing data', async () => {
    await withHarness(async ({ server, prisma }) => {
      const before = await prisma.evidence.count();

      const missingQueryResponse = await fetch(
        `${server.baseUrl}/api/evidence`,
      );
      assert.equal(missingQueryResponse.status, 400);
      assert.equal(
        (await readError(missingQueryResponse)).error.code,
        'VALIDATION_ERROR',
      );

      const missingAssessmentResponse = await fetch(
        `${server.baseUrl}/api/evidence?assessmentId=${missingAssessmentId}`,
      );
      assert.equal(missingAssessmentResponse.status, 404);
      assert.equal(
        (await readError(missingAssessmentResponse)).error.code,
        'ASSESSMENT_NOT_FOUND',
      );

      const malformedIdResponse = await fetch(
        `${server.baseUrl}/api/evidence/not-an-evidence-id`,
      );
      assert.equal(malformedIdResponse.status, 400);
      assert.equal(
        (await readError(malformedIdResponse)).error.code,
        'VALIDATION_ERROR',
      );

      for (const method of ['GET', 'PATCH', 'DELETE'] as const) {
        const response = await fetch(
          `${server.baseUrl}/api/evidence/${missingEvidenceId}`,
          method === 'PATCH'
            ? {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: 'Must not persist' }),
              }
            : { method },
        );

        assert.equal(response.status, 404);
        assert.equal(
          (await readError(response)).error.code,
          'EVIDENCE_NOT_FOUND',
        );
      }

      assert.equal(await prisma.evidence.count(), before);
    });
  });

  it('rejects invalid relationships and request metadata without partial persistence', async () => {
    await withHarness(async ({ server, prisma, assessment, primaryThreat }) => {
      const before = await prisma.evidence.count();

      const missingThreatResponse = await fetch(
        `${server.baseUrl}/api/evidence`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assessmentId: assessment.id,
            threatIds: ['thr_00000000-0000-0000-0000-000000000099'],
            type: 'note',
            title: 'Missing Threat link',
          }),
        },
      );

      assert.equal(missingThreatResponse.status, 400);
      assert.equal(await prisma.evidence.count(), before);

      const invalidFileResponse = await fetch(
        `${server.baseUrl}/api/evidence`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assessmentId: assessment.id,
            threatIds: [primaryThreat.id],
            type: 'file',
            title: 'Unsafe file',
            fileName: '../capture.txt',
            mimeType: 'text/plain',
          }),
        },
      );

      assert.equal(invalidFileResponse.status, 400);
      assert.equal(
        (await readError(invalidFileResponse)).error.code,
        'VALIDATION_ERROR',
      );
      assert.equal(await prisma.evidence.count(), before);

      const unsupportedMediaResponse = await fetch(
        `${server.baseUrl}/api/evidence`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: '{}',
        },
      );

      assert.equal(unsupportedMediaResponse.status, 415);
      assert.equal(
        (await readError(unsupportedMediaResponse)).error.code,
        'UNSUPPORTED_MEDIA_TYPE',
      );
      assert.equal(await prisma.evidence.count(), before);
    });
  });

  it('preserves stored fields and exchanges after an invalid PATCH', async () => {
    await withHarness(async ({ server, prisma, assessment }) => {
      const createResponse = await fetch(`${server.baseUrl}/api/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId: assessment.id,
          threatIds: [],
          type: 'http',
          title: 'Original HTTP evidence',
          httpExchanges: [
            {
              request: { method: 'GET', url: '/api/orders/1' },
              response: { statusCode: 200 },
            },
          ],
        }),
      });
      const created = (await createResponse.json()) as {
        data: { id: string };
      };
      const before = await prisma.evidence.findUnique({
        where: { id: created.data.id },
        include: { httpExchanges: true, threatLinks: true },
      });

      const invalidPatchResponse = await fetch(
        `${server.baseUrl}/api/evidence/${created.data.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Must not persist',
            type: 'http',
            httpExchanges: [],
          }),
        },
      );

      assert.equal(invalidPatchResponse.status, 400);
      assert.deepEqual(
        await prisma.evidence.findUnique({
          where: { id: created.data.id },
          include: { httpExchanges: true, threatLinks: true },
        }),
        before,
      );
    });
  });

  it('does not leak persistence details in an unexpected failure', async () => {
    await withHarness(async ({ server, prisma, assessment }) => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      try {
        await prisma.$executeRawUnsafe(
          'ALTER TABLE "Evidence" RENAME TO "EvidenceUnavailable"',
        );

        const response = await fetch(
          `${server.baseUrl}/api/evidence?assessmentId=${assessment.id}`,
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
        assert.equal(
          JSON.stringify(body).includes('EvidenceUnavailable'),
          false,
        );
        assert.equal(consoleError.mock.calls.length > 0, true);
      } finally {
        consoleError.mockRestore();
      }
    });
  });
});

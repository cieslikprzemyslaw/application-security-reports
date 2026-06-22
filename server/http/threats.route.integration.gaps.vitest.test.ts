import assert from 'node:assert/strict';

import { describe, it, vi } from 'vitest';

import {
  createThreatsRouteIntegrationHarness,
  type ThreatsRouteIntegrationHarness,
} from './threats.route.integration.test/support.js';

type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details: Array<{ path?: string; message?: string; code?: string }>;
  };
};

const missingAssessmentId = 'asm_00000000-0000-0000-0000-000000000099';
const missingThreatId = 'thr_00000000-0000-0000-0000-000000000099';

const readError = async (response: Response): Promise<ApiErrorBody> =>
  response.json() as Promise<ApiErrorBody>;

const withHarness = async (
  run: (harness: ThreatsRouteIntegrationHarness) => Promise<void>,
) => {
  const harness = await createThreatsRouteIntegrationHarness();

  try {
    await run(harness);
  } finally {
    await harness.cleanup();
  }
};

describe('Threat API integration gaps', () => {
  it('returns safe validation and not-found errors without changing data', async () => {
    await withHarness(async ({ server, prisma }) => {
      const countBefore = await prisma.threat.count();

      const missingQueryResponse = await fetch(`${server.baseUrl}/api/threats`);
      const missingQueryBody = await readError(missingQueryResponse);

      assert.equal(missingQueryResponse.status, 400);
      assert.equal(missingQueryBody.error.code, 'VALIDATION_ERROR');
      assert.equal(
        missingQueryBody.error.details.some(
          detail => detail.path === 'assessmentId',
        ),
        true,
      );

      const missingAssessmentResponse = await fetch(
        `${server.baseUrl}/api/threats?assessmentId=${missingAssessmentId}`,
      );
      const missingAssessmentBody = await readError(missingAssessmentResponse);

      assert.equal(missingAssessmentResponse.status, 404);
      assert.equal(missingAssessmentBody.error.code, 'ASSESSMENT_NOT_FOUND');
      assert.equal(missingAssessmentBody.error.message, 'Assessment not found');

      const malformedIdResponse = await fetch(
        `${server.baseUrl}/api/threats/not-a-threat-id`,
      );
      const malformedIdBody = await readError(malformedIdResponse);

      assert.equal(malformedIdResponse.status, 400);
      assert.equal(malformedIdBody.error.code, 'VALIDATION_ERROR');

      for (const method of ['GET', 'PATCH', 'DELETE'] as const) {
        const response = await fetch(
          `${server.baseUrl}/api/threats/${missingThreatId}`,
          method === 'PATCH'
            ? {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: 'Must not persist' }),
              }
            : { method },
        );
        const body = await readError(response);

        assert.equal(response.status, 404);
        assert.equal(body.error.code, 'THREAT_NOT_FOUND');
        assert.equal(body.error.message, 'Threat not found');
      }

      assert.equal(await prisma.threat.count(), countBefore);
    });
  });

  it('rejects invalid writes without partial persistence', async () => {
    await withHarness(
      async ({ server, prisma, primaryAssessment, secondaryThreat }) => {
        const countBefore = await prisma.threat.count();

        const invalidCreateResponse = await fetch(
          `${server.baseUrl}/api/threats`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              assessmentId: primaryAssessment.id,
              title: 'Invalid create',
              description: 'The request contains a server-owned field.',
              severity: 'high',
              strideCategories: ['spoofing'],
              status: 'open',
              owaspCategoryCode: 'A01:2025',
              id: 'thr_00000000-0000-0000-0000-000000000088',
            }),
          },
        );

        assert.equal(invalidCreateResponse.status, 400);
        assert.equal(
          (await readError(invalidCreateResponse)).error.code,
          'VALIDATION_ERROR',
        );
        assert.equal(await prisma.threat.count(), countBefore);

        const unsupportedMediaResponse = await fetch(
          `${server.baseUrl}/api/threats`,
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
        assert.equal(await prisma.threat.count(), countBefore);

        const beforePatch = await prisma.threat.findUnique({
          where: { id: secondaryThreat.id },
        });

        const invalidPatchResponse = await fetch(
          `${server.baseUrl}/api/threats/${secondaryThreat.id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: 'Must not persist',
              assessmentId: primaryAssessment.id,
            }),
          },
        );

        assert.equal(invalidPatchResponse.status, 400);
        assert.equal(
          (await readError(invalidPatchResponse)).error.code,
          'VALIDATION_ERROR',
        );
        assert.deepEqual(
          await prisma.threat.findUnique({
            where: { id: secondaryThreat.id },
          }),
          beforePatch,
        );
        assert.equal(await prisma.threat.count(), countBefore);
      },
    );
  });

  it('does not leak persistence details in an unexpected failure', async () => {
    await withHarness(async ({ server, prisma, primaryAssessment }) => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      try {
        await prisma.$executeRawUnsafe(
          'ALTER TABLE "Threat" RENAME TO "ThreatUnavailable"',
        );

        const response = await fetch(
          `${server.baseUrl}/api/threats?assessmentId=${primaryAssessment.id}`,
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
        assert.equal(JSON.stringify(body).includes('ThreatUnavailable'), false);
        assert.equal(consoleError.mock.calls.length > 0, true);
      } finally {
        consoleError.mockRestore();
      }
    });
  });
});

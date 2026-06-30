import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { readError, withHarness } from './support.js';

describe('Threat API integration gaps: invalid writes', () => {
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
});

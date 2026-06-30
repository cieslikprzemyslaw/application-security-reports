import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { readError, withHarness } from './support.js';

describe('Evidence API integration gaps: relationships and metadata', () => {
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
});

import assert from 'node:assert/strict';

import { describe, it, vi } from 'vitest';

import { readError, withHarness } from './support.js';

describe('Evidence API integration gaps: internal errors', () => {
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

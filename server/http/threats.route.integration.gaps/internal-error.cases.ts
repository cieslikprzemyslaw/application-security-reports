import assert from 'node:assert/strict';

import { describe, it, vi } from 'vitest';

import { readError, withHarness } from './support.js';

describe('Threat API integration gaps: internal errors', () => {
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

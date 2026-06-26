import assert from 'node:assert/strict';

import { describe, it, vi } from 'vitest';

import { readError, withHarness } from './support.js';

describe('Companies API internal failures', () => {
  it('does not leak SQLite or persistence details from an unexpected failure', async () => {
    await withHarness(async ({ database, server }) => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      try {
        await database.prisma.$executeRawUnsafe(
          'ALTER TABLE "Company" RENAME TO "CompanyUnavailable"',
        );

        const response = await fetch(`${server.baseUrl}/api/companies`);
        const body = await readError(response);
        const serializedBody = JSON.stringify(body);

        assert.equal(response.status, 500);
        assert.deepEqual(body, {
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Unexpected server error',
            details: [],
          },
        });
        assert.equal(serializedBody.includes('no such table'), false);
        assert.equal(serializedBody.includes('CompanyUnavailable'), false);
        assert.equal(serializedBody.includes(database.tempDir), false);
        assert.equal(consoleError.mock.calls.length > 0, true);
      } finally {
        consoleError.mockRestore();
      }
    });
  });
});

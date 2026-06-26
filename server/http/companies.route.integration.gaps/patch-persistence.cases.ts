import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { createCompany, readError, withHarness } from './support.js';

describe('Companies API PATCH persistence', () => {
  it('rejects empty and server-owned PATCH fields without changing the row', async () => {
    await withHarness(async ({ database, repositories, server }) => {
      const company = await createCompany(repositories);
      const rowBefore = await database.prisma.company.findUnique({
        where: { id: company.id },
      });

      assert.ok(rowBefore);

      const invalidPatchBodies = [
        {},
        {
          name: 'Must not persist',
          archivedAt: '2026-06-26T12:00:00.000Z',
        },
        {
          website: 'not-a-url',
          contactEmail: 'not-an-email',
        },
      ];

      for (const body of invalidPatchBodies) {
        const response = await fetch(
          `${server.baseUrl}/api/companies/${company.id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          },
        );
        const error = await readError(response);

        assert.equal(response.status, 400);
        assert.equal(error.error.code, 'VALIDATION_ERROR');
        assert.deepEqual(
          await database.prisma.company.findUnique({
            where: { id: company.id },
          }),
          rowBefore,
        );
      }

      assert.equal(await database.prisma.company.count(), 1);
    });
  });
});

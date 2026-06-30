import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { withHarness } from './support.js';

describe('Evidence API integration gaps: patch persistence', () => {
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
});

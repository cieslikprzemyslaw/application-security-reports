import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import {
  missingAssessmentId,
  missingEvidenceId,
  readError,
  withHarness,
} from './support.js';

describe('Evidence API integration gaps: validation and not found', () => {
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
});

import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import {
  missingAssessmentId,
  missingThreatId,
  readError,
  withHarness,
} from './support.js';

describe('Threat API integration gaps: validation and not found', () => {
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
});

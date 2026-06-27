import { expect, it } from 'vitest';

import {
  describeAssessmentsRouteIntegration,
  missingAssessmentId,
  readJson,
} from './caseSupport.js';

describeAssessmentsRouteIntegration(
  'Assessments API integration missing resources',
  getHarness => {
    it('returns safe not-found errors and leaves existing data unchanged', async () => {
      const { server, prisma, assessment } = getHarness();
      const before = await prisma.assessment.findUnique({
        where: { id: assessment.id },
      });

      const getResponse = await fetch(
        `${server.baseUrl}/api/assessments/${missingAssessmentId}`,
      );

      expect(getResponse.status).toBe(404);
      await expect(readJson(getResponse)).resolves.toEqual({
        error: {
          code: 'ASSESSMENT_NOT_FOUND',
          message: 'Assessment not found',
          details: [],
        },
      });

      const patchResponse = await fetch(
        `${server.baseUrl}/api/assessments/${missingAssessmentId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Must not be persisted',
          }),
        },
      );

      expect(patchResponse.status).toBe(404);
      await expect(readJson(patchResponse)).resolves.toEqual({
        error: {
          code: 'ASSESSMENT_NOT_FOUND',
          message: 'Assessment not found',
          details: [],
        },
      });

      await expect(
        prisma.assessment.findUnique({
          where: { id: assessment.id },
        }),
      ).resolves.toEqual(before);
    });
  },
);

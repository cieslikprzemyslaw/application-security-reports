import { expect, it } from 'vitest';

import {
  describeAssessmentsRouteIntegration,
  readJson,
} from './caseSupport.js';

describeAssessmentsRouteIntegration(
  'Assessments API integration PATCH validation',
  getHarness => {
    it('rejects an invalid patch without partially updating the assessment', async () => {
      const { server, prisma, assessment } = getHarness();
      const before = await prisma.assessment.findUnique({
        where: { id: assessment.id },
      });

      const response = await fetch(
        `${server.baseUrl}/api/assessments/${assessment.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Must not be persisted',
            applicationName: '   ',
          }),
        },
      );

      expect(response.status).toBe(400);

      const body = await readJson<{
        error: {
          code: string;
          message: string;
          details: Array<{ path: string; message: string }>;
        };
      }>(response);

      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toBe('Request validation failed');
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'applicationName',
            message: expect.stringContaining('Text is required'),
          }),
        ]),
      );

      await expect(
        prisma.assessment.findUnique({
          where: { id: assessment.id },
        }),
      ).resolves.toEqual(before);
    });
  },
);

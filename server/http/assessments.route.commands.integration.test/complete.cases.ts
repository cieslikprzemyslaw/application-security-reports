import { expect, it } from 'vitest';

import {
  describeAssessmentsRouteIntegration,
  readJson,
} from '../assessments.route.integration.test/caseSupport.js';

describeAssessmentsRouteIntegration(
  'Assessment complete command integration',
  getHarness => {
    it('persists completion and rejects a stale record version safely', async () => {
      const { server, prisma, company, assessment, assessmentRepository } =
        getHarness();

      const completeResponse = await fetch(
        `${server.baseUrl}/api/companies/${company.id}/assessments/${assessment.id}/commands/complete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recordVersion: new Date(assessment.updatedAt).getTime(),
          }),
        },
      );

      expect(completeResponse.status).toBe(200);
      await expect(readJson(completeResponse)).resolves.toEqual({
        data: expect.objectContaining({
          assessment: expect.objectContaining({
            status: 'completed',
            completedAt: expect.any(String),
            availableActions: ['reopen', 'archive'],
          }),
        }),
      });

      await expect(
        prisma.assessment.findUnique({
          where: { id: assessment.id },
          select: { status: true, completedAt: true },
        }),
      ).resolves.toEqual({
        status: 'completed',
        completedAt: expect.any(String),
      });

      const completedOverviewResponse = await fetch(
        `${server.baseUrl}/api/companies/${company.id}/assessments/${assessment.id}/overview`,
      );

      expect(completedOverviewResponse.status).toBe(200);
      await expect(readJson(completedOverviewResponse)).resolves.toEqual({
        data: expect.objectContaining({
          assessment: expect.objectContaining({
            status: 'completed',
          }),
        }),
      });

      const conflicted = await assessmentRepository.create({
        companyId: company.id,
        title: 'Conflicted assessment',
        description: undefined,
        scope: undefined,
        status: 'in-progress',
        startedAt: '2026-06-21',
        completedAt: undefined,
        applicationName: 'Conflicted assessment',
        environment: undefined,
        assessmentType: undefined,
        overallRisk: undefined,
      });
      const staleRecordVersion = new Date(conflicted.updatedAt).getTime();

      await new Promise(resolve => setTimeout(resolve, 5));
      await assessmentRepository.update(conflicted.id, {
        title: 'Updated by another session',
      });

      const conflictResponse = await fetch(
        `${server.baseUrl}/api/companies/${company.id}/assessments/${conflicted.id}/commands/complete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recordVersion: staleRecordVersion,
          }),
        },
      );

      expect(conflictResponse.status).toBe(409);
      await expect(readJson(conflictResponse)).resolves.toEqual({
        error: {
          code: 'RESOURCE_MODIFIED',
          message: 'The assessment was modified by another session.',
          details: [],
        },
      });

      await expect(
        prisma.assessment.findUnique({
          where: { id: conflicted.id },
          select: { status: true, completedAt: true, title: true },
        }),
      ).resolves.toEqual({
        status: 'in-progress',
        completedAt: null,
        title: 'Updated by another session',
      });
    });
  },
);

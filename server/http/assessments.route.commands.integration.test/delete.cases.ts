import { expect, it } from 'vitest';

import {
  describeAssessmentsRouteIntegration,
  readJson,
} from '../assessments.route.integration.test/caseSupport.js';

describeAssessmentsRouteIntegration(
  'Assessment delete integration',
  getHarness => {
    it('cascades owned records and preserves a conflicted delete', async () => {
      const { server, prisma, company, assessmentRepository } = getHarness();

      const cascadeAssessment = await assessmentRepository.create({
        companyId: company.id,
        title: 'Cascade delete assessment',
        description: undefined,
        scope: undefined,
        status: 'draft',
        startedAt: undefined,
        completedAt: undefined,
        applicationName: 'Cascade delete assessment',
        environment: undefined,
        assessmentType: undefined,
        overallRisk: undefined,
      });

      await prisma.threat.create({
        data: {
          id: 'thr_00000000-0000-0000-0000-000000000091',
          assessmentId: cascadeAssessment.id,
          title: 'Missing object authorization',
          description: 'Another customer record can be loaded.',
          severity: 'high',
          strideCategories: ['spoofing'],
          status: 'open',
        },
      });
      await prisma.evidence.create({
        data: {
          id: 'evd_00000000-0000-0000-0000-000000000091',
          assessmentId: cascadeAssessment.id,
          type: 'note',
          title: 'Reproduction notes',
        },
      });

      const deleteResponse = await fetch(
        `${server.baseUrl}/api/assessments/${cascadeAssessment.id}`,
        {
          method: 'DELETE',
        },
      );

      expect(deleteResponse.status).toBe(204);
      expect(await deleteResponse.text()).toBe('');
      await expect(
        prisma.assessment.findUnique({
          where: { id: cascadeAssessment.id },
        }),
      ).resolves.toBeNull();
      await expect(
        prisma.threat.count({
          where: { assessmentId: cascadeAssessment.id },
        }),
      ).resolves.toBe(0);
      await expect(
        prisma.evidence.count({
          where: { assessmentId: cascadeAssessment.id },
        }),
      ).resolves.toBe(0);

      const blockedAssessment = await assessmentRepository.create({
        companyId: company.id,
        title: 'Blocked delete assessment',
        description: undefined,
        scope: undefined,
        status: 'draft',
        startedAt: undefined,
        completedAt: undefined,
        applicationName: 'Blocked delete assessment',
        environment: undefined,
        assessmentType: undefined,
        overallRisk: undefined,
      });

      await prisma.assessment.update({
        where: { id: blockedAssessment.id },
        data: { applicationName: null },
      });

      const blockedAssessmentResponse = await fetch(
        `${server.baseUrl}/api/assessments/${blockedAssessment.id}`,
      );

      expect(blockedAssessmentResponse.status).toBe(200);
      await expect(readJson(blockedAssessmentResponse)).resolves.toEqual({
        data: expect.objectContaining({
          applicationName: null,
        }),
      });

      await prisma.report.create({
        data: {
          id: 'rpt_00000000-0000-0000-0000-000000000091',
          assessmentId: blockedAssessment.id,
          title: 'Blocking report',
        },
      });

      const blockedDeleteResponse = await fetch(
        `${server.baseUrl}/api/assessments/${blockedAssessment.id}`,
        {
          method: 'DELETE',
        },
      );

      expect(blockedDeleteResponse.status).toBe(409);
      await expect(readJson(blockedDeleteResponse)).resolves.toEqual({
        error: {
          code: 'ASSESSMENT_DELETE_CONFLICT',
          message: 'Assessment cannot be deleted while related reports exist',
          details: [],
        },
      });
      await expect(
        prisma.assessment.findUnique({
          where: { id: blockedAssessment.id },
        }),
      ).resolves.not.toBeNull();
      await expect(
        prisma.report.count({
          where: { assessmentId: blockedAssessment.id },
        }),
      ).resolves.toBe(1);
    });
  },
);

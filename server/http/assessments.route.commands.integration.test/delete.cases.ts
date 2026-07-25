import { expect, it } from 'vitest';

import {
  hasAssessmentDeletionOperations,
  hasAssessmentLifecycleOperations,
} from '../../database/repositories/assessment.repository.js';
import {
  describeAssessmentsRouteIntegration,
  readJson,
} from '../assessments.route.integration.test/caseSupport.js';

describeAssessmentsRouteIntegration(
  'Assessment permanent delete integration',
  getHarness => {
    it('previews impact, rejects active deletion, and deletes archived owned records', async () => {
      const { server, prisma, company, assessmentRepository } = getHarness();
      const assessment = await assessmentRepository.create({
        companyId: company.id,
        title: 'Permanent delete assessment',
        description: undefined,
        scope: undefined,
        status: 'draft',
        startedAt: undefined,
        completedAt: undefined,
        applicationName: 'Permanent delete assessment',
        environment: undefined,
        assessmentType: undefined,
        overallRisk: undefined,
      });

      await prisma.threat.create({
        data: {
          id: 'thr_00000000-0000-0000-0000-000000000091',
          assessmentId: assessment.id,
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
          assessmentId: assessment.id,
          type: 'note',
          title: 'Reproduction notes',
        },
      });

      const activeDeleteResponse = await fetch(
        `${server.baseUrl}/api/assessments/${assessment.id}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recordVersion: new Date(assessment.updatedAt).getTime(),
          }),
        },
      );

      expect(activeDeleteResponse.status).toBe(409);
      await expect(readJson(activeDeleteResponse)).resolves.toEqual({
        error: {
          code: 'ASSESSMENT_DELETE_CONFLICT',
          message: 'Only archived Assessments can be permanently deleted',
          details: [],
        },
      });

      if (!hasAssessmentLifecycleOperations(assessmentRepository)) {
        throw new Error('Expected Assessment lifecycle operations.');
      }

      const archived = await assessmentRepository.archive(
        assessment.id,
        new Date(assessment.updatedAt).getTime(),
      );
      const impactResponse = await fetch(
        `${server.baseUrl}/api/assessments/${assessment.id}/deletion-impact`,
      );

      expect(impactResponse.status).toBe(200);
      const impactBody = (await readJson(impactResponse)) as {
        data: {
          recordVersion: number;
          threatCount: number;
          evidenceCount: number;
          canDelete: boolean;
        };
      };

      expect(impactBody.data).toEqual(
        expect.objectContaining({
          recordVersion: new Date(archived.updatedAt).getTime(),
          threatCount: 1,
          evidenceCount: 1,
          canDelete: true,
        }),
      );

      const deleteResponse = await fetch(
        `${server.baseUrl}/api/assessments/${assessment.id}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recordVersion: impactBody.data.recordVersion,
          }),
        },
      );

      expect(deleteResponse.status).toBe(200);
      await expect(readJson(deleteResponse)).resolves.toEqual({
        data: { cleanupWarnings: [] },
      });
      await expect(
        prisma.assessment.findUnique({ where: { id: assessment.id } }),
      ).resolves.toBeNull();
      await expect(
        prisma.threat.count({ where: { assessmentId: assessment.id } }),
      ).resolves.toBe(0);
      await expect(
        prisma.evidence.count({ where: { assessmentId: assessment.id } }),
      ).resolves.toBe(0);
    });

    it('keeps retained Report versions and returns safe deletion warnings', async () => {
      const { server, prisma, company, assessmentRepository } = getHarness();
      const assessment = await assessmentRepository.create({
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

      if (
        !hasAssessmentLifecycleOperations(assessmentRepository) ||
        !hasAssessmentDeletionOperations(assessmentRepository)
      ) {
        throw new Error(
          'Expected Assessment lifecycle and deletion operations.',
        );
      }

      const archived = await assessmentRepository.archive(
        assessment.id,
        new Date(assessment.updatedAt).getTime(),
      );

      await prisma.report.create({
        data: {
          id: 'rpt_00000000-0000-0000-0000-000000000091',
          assessmentId: assessment.id,
          title: 'Blocking report',
          versions: {
            create: {
              id: 'rvs_00000000-0000-0000-0000-000000000091',
              version: 1,
              status: 'draft',
              generatedAt: '2026-07-25T12:00:00.000Z',
              snapshot: {},
            },
          },
        },
      });

      const impactResponse = await fetch(
        `${server.baseUrl}/api/assessments/${assessment.id}/deletion-impact`,
      );
      const impactBody = (await readJson(impactResponse)) as {
        data: {
          reportCount: number;
          reportVersionCount: number;
          canDelete: boolean;
          warnings: string[];
        };
      };

      expect(impactBody.data).toEqual(
        expect.objectContaining({
          reportCount: 1,
          reportVersionCount: 1,
          canDelete: false,
        }),
      );
      expect(impactBody.data.warnings.join(' ')).not.toMatch(
        /filePath|storageKey|uploads\//,
      );

      const blockedDeleteResponse = await fetch(
        `${server.baseUrl}/api/assessments/${assessment.id}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recordVersion: new Date(archived.updatedAt).getTime(),
          }),
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
        prisma.assessment.findUnique({ where: { id: assessment.id } }),
      ).resolves.not.toBeNull();
      await expect(prisma.reportVersion.count()).resolves.toBe(1);
    });
  },
);

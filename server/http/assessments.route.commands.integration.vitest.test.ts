import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createAssessmentsRouteIntegrationHarness,
  type AssessmentsRouteIntegrationHarness,
} from './assessments.route.integration.test/support.js';

const readJson = async <T>(response: Response): Promise<T> =>
  response.json() as Promise<T>;

describe.sequential('Assessment command integration', () => {
  let harness: AssessmentsRouteIntegrationHarness | undefined;

  beforeEach(async () => {
    harness = await createAssessmentsRouteIntegrationHarness();
  });

  afterEach(async () => {
    await harness?.cleanup();
    harness = undefined;
  });

  const getHarness = (): AssessmentsRouteIntegrationHarness => {
    if (!harness) {
      throw new Error('Assessment integration harness is not available.');
    }

    return harness;
  };

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
});

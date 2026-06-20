import assert from 'node:assert/strict';

import type { PrismaClient } from '../../generated/prisma/client.js';
import type { AssessmentRepository } from '../database/repositories/assessment.repository.js';

type CompleteIntegrationCasesInput = {
  baseUrl: string;
  companyId: string;
  assessmentId: string;
  assessmentRepository: AssessmentRepository;
  prisma: PrismaClient;
  recordVersion: string;
};

export const runAssessmentCompleteIntegrationCases = async ({
  baseUrl,
  companyId,
  assessmentId,
  assessmentRepository,
  prisma,
  recordVersion,
}: CompleteIntegrationCasesInput) => {
  const completeResponse = await fetch(
    `${baseUrl}/api/companies/${companyId}/assessments/${assessmentId}/commands/complete`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recordVersion: new Date(recordVersion).getTime(),
      }),
    },
  );

  assert.equal(completeResponse.status, 200);
  const completeJson = (await completeResponse.json()) as {
    data: {
      status: string;
      completedAt: string;
      availableActions: string[];
    };
  };
  assert.equal(completeJson.data.status, 'completed');
  assert.equal(typeof completeJson.data.completedAt, 'string');
  assert.deepEqual(completeJson.data.availableActions, ['reopen', 'archive']);

  const completedAssessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { status: true, completedAt: true },
  });
  assert.equal(completedAssessment?.status, 'completed');
  assert.equal(completedAssessment?.completedAt, completeJson.data.completedAt);

  const completedOverviewResponse = await fetch(
    `${baseUrl}/api/companies/${companyId}/assessments/${assessmentId}/overview`,
  );
  assert.equal(completedOverviewResponse.status, 200);
  const completedOverviewJson = (await completedOverviewResponse.json()) as {
    data: { assessment: { status: string } };
  };
  assert.equal(completedOverviewJson.data.assessment.status, 'completed');

  const conflictedAssessment = await assessmentRepository.create({
    companyId,
    title: 'Conflicted complete assessment',
    description: undefined,
    scope: undefined,
    status: 'in-progress',
    startedAt: '2026-06-15',
    completedAt: undefined,
    applicationName: 'Conflicted Assessment',
    environment: undefined,
    assessmentType: undefined,
    overallRisk: undefined,
  });
  const staleRecordVersion = new Date(conflictedAssessment.updatedAt).getTime();

  await assessmentRepository.update(conflictedAssessment.id, {
    title: 'Conflicted complete assessment - updated elsewhere',
  });

  const conflictedCompleteResponse = await fetch(
    `${baseUrl}/api/companies/${companyId}/assessments/${conflictedAssessment.id}/commands/complete`,
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
  assert.equal(conflictedCompleteResponse.status, 409);
  assert.deepEqual(await conflictedCompleteResponse.json(), {
    error: {
      code: 'RESOURCE_MODIFIED',
      message: 'The assessment was modified by another session.',
      details: [],
    },
  });

  const conflictedAssessmentAfter = await prisma.assessment.findUnique({
    where: { id: conflictedAssessment.id },
    select: { status: true, completedAt: true, title: true },
  });
  assert.equal(conflictedAssessmentAfter?.status, 'in-progress');
  assert.equal(conflictedAssessmentAfter?.completedAt, null);
  assert.equal(
    conflictedAssessmentAfter?.title,
    'Conflicted complete assessment - updated elsewhere',
  );
};

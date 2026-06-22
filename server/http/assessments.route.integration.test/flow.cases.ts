import assert from 'node:assert/strict';

import { runAssessmentCompleteIntegrationCases } from '../assessments.route.integration.complete.cases.js';
import { OWASP_TOP_10_CURRENT_VERSION } from '../../../src/domain/index.js';
import type { AssessmentsRouteIntegrationHarness } from './support.js';

export const runAssessmentsRouteIntegrationCases = async ({
  server,
  prisma,
  company,
  assessmentRepository,
}: AssessmentsRouteIntegrationHarness) => {
  const createResponse = await fetch(`${server.baseUrl}/api/assessments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      companyId: company.id,
      title: 'Customer Services Portal',
      description: 'Assessment of the customer portal',
      scope: 'Web application',
      status: 'in-progress',
      startedAt: '2026-06-01',
      completedAt: '2026-06-10',
      applicationName: 'Customer Services Portal',
      environment: 'Production',
      assessmentType: 'Web App',
      overallRisk: 'high',
    }),
  });

  assert.equal(createResponse.status, 201);
  assert.equal(
    createResponse.headers.get('location')?.startsWith('/api/assessments/asm_'),
    true,
  );
  const createJson = (await createResponse.json()) as {
    data: {
      id: string;
      companyId: string;
      title: string;
      overallRisk?: string;
      owaspTaxonomyVersion?: string;
      updatedAt: string;
    };
  };
  assert.equal(createJson.data.id.startsWith('asm_'), true);
  assert.equal(createJson.data.companyId, company.id);
  assert.equal(createJson.data.title, 'Customer Services Portal');
  assert.equal(
    createJson.data.owaspTaxonomyVersion,
    OWASP_TOP_10_CURRENT_VERSION,
  );

  const assessmentId = createJson.data.id;

  const getResponse = await fetch(
    `${server.baseUrl}/api/assessments/${assessmentId}`,
  );
  assert.equal(getResponse.status, 200);
  const getJson = (await getResponse.json()) as {
    data: { id: string; companyId: string; title: string };
  };
  assert.equal(getJson.data.id, assessmentId);
  assert.equal(getJson.data.companyId, company.id);

  const listResponse = await fetch(`${server.baseUrl}/api/assessments`);
  assert.equal(listResponse.status, 200);
  const listJson = (await listResponse.json()) as {
    data: Array<{ id: string }>;
  };
  assert.equal(listJson.data.length, 2);
  assert.equal(listJson.data[0]?.id, assessmentId);

  const filterResponse = await fetch(
    `${server.baseUrl}/api/assessments?companyId=${company.id}`,
  );
  assert.equal(filterResponse.status, 200);
  const filterJson = (await filterResponse.json()) as {
    data: Array<{ id: string }>;
  };
  assert.equal(filterJson.data.length, 2);
  assert.equal(filterJson.data[0]?.id, assessmentId);

  const patchResponse = await fetch(
    `${server.baseUrl}/api/assessments/${assessmentId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Customer Services Portal - Updated',
        applicationName: ' Customer Services Portal Public Site ',
        overallRisk: 'medium',
      }),
    },
  );
  assert.equal(patchResponse.status, 200);
  const patchJson = (await patchResponse.json()) as {
    data: {
      id: string;
      title: string;
      applicationName: string | null;
      overallRisk?: string;
      owaspTaxonomyVersion?: string;
      updatedAt: string;
    };
  };
  assert.equal(patchJson.data.id, assessmentId);
  assert.equal(patchJson.data.title, 'Customer Services Portal - Updated');
  assert.equal(
    patchJson.data.applicationName,
    'Customer Services Portal Public Site',
  );
  assert.equal(patchJson.data.overallRisk, 'medium');
  assert.equal(
    patchJson.data.owaspTaxonomyVersion,
    OWASP_TOP_10_CURRENT_VERSION,
  );

  const storedAssessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { owaspTaxonomyVersion: true },
  });
  assert.equal(
    storedAssessment?.owaspTaxonomyVersion,
    OWASP_TOP_10_CURRENT_VERSION,
  );
  await runAssessmentCompleteIntegrationCases({
    baseUrl: server.baseUrl,
    companyId: company.id,
    assessmentId,
    assessmentRepository,
    prisma,
    recordVersion: patchJson.data.updatedAt,
  });

  await prisma.threat.create({
    data: {
      id: 'thr_00000000-0000-0000-0000-000000000001',
      assessmentId,
      title: 'Missing authorization',
      description: 'An authenticated user can access another record.',
      severity: 'high',
      strideCategories: ['spoofing'],
      status: 'open',
    },
  });

  await prisma.evidence.create({
    data: {
      id: 'evd_00000000-0000-0000-0000-000000000001',
      assessmentId,
      type: 'note',
      title: 'Investigation notes',
    },
  });

  const deleteResponse = await fetch(
    `${server.baseUrl}/api/assessments/${assessmentId}`,
    {
      method: 'DELETE',
    },
  );
  assert.equal(deleteResponse.status, 204);
  assert.equal(await deleteResponse.text(), '');

  assert.equal(
    await prisma.threat.count({
      where: { assessmentId },
    }),
    0,
  );
  assert.equal(
    await prisma.evidence.count({
      where: { assessmentId },
    }),
    0,
  );

  const blockedAssessment = await assessmentRepository.create({
    companyId: company.id,
    title: 'Blocked delete assessment',
    description: undefined,
    scope: undefined,
    status: 'draft',
    startedAt: undefined,
    completedAt: undefined,
    applicationName: 'Historical Portal',
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
  assert.equal(blockedAssessmentResponse.status, 200);
  const blockedAssessmentJson = (await blockedAssessmentResponse.json()) as {
    data: { applicationName: string | null };
  };
  assert.equal(blockedAssessmentJson.data.applicationName, null);

  await prisma.report.create({
    data: {
      id: 'rpt_00000000-0000-0000-0000-000000000001',
      assessmentId: blockedAssessment.id,
      title: 'Blocked delete report',
    },
  });

  const blockedDeleteResponse = await fetch(
    `${server.baseUrl}/api/assessments/${blockedAssessment.id}`,
    {
      method: 'DELETE',
    },
  );
  assert.equal(blockedDeleteResponse.status, 409);
  const blockedDeleteJson = (await blockedDeleteResponse.json()) as {
    error: { code: string; message: string; details: [] };
  };
  assert.deepEqual(blockedDeleteJson, {
    error: {
      code: 'ASSESSMENT_DELETE_CONFLICT',
      message: 'Assessment cannot be deleted while related reports exist',
      details: [],
    },
  });
};

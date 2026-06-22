import assert from 'node:assert/strict';

import {
  startTestServer,
  readJson,
  defaultCompany,
  defaultAssessment,
  createAssessmentRepository,
  createCompanyRepository,
  createApp,
} from './support.js';

{
  const { calls, repository } = createAssessmentRepository({
    update: async (_id, input) => ({
      ...defaultAssessment,
      id: defaultAssessment.id,
      status: 'completed',
      completedAt: '2026-06-12T10:00:00.000Z',
      updatedAt: '2026-06-12T10:00:00.000Z',
      ...input,
    }),
  });
  const { calls: companyCalls, repository: companyRepository } =
    createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}/assessments/${defaultAssessment.id}/commands/complete`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordVersion: new Date(defaultAssessment.updatedAt).getTime(),
        }),
      },
    );

    assert.equal(response.status, 200);
    assert.equal(companyCalls.findById, 1);
    assert.equal(calls.findById, 1);
    assert.equal(calls.update, 1);
    assert.equal(calls.updateArgs?.id, defaultAssessment.id);
    assert.equal(calls.updateArgs?.input.status, 'completed');
    assert.equal(typeof calls.updateArgs?.input.completedAt, 'string');
    const body = await readJson<{
      data: {
        assessment: typeof defaultAssessment & {
          availableActions: string[];
        };
      };
    }>(response);
    assert.equal(body.data.assessment.status, 'completed');
    assert.equal(
      body.data.assessment.completedAt,
      calls.updateArgs?.input.completedAt,
    );
    assert.deepEqual(body.data.assessment.availableActions, [
      'reopen',
      'archive',
    ]);
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createAssessmentRepository();
  const { calls: companyCalls, repository: companyRepository } =
    createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}/assessments/${defaultAssessment.id}/commands/complete`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordVersion: new Date(defaultAssessment.updatedAt).getTime() + 1,
        }),
      },
    );

    assert.equal(response.status, 409);
    assert.equal(companyCalls.findById, 1);
    assert.equal(calls.findById, 1);
    assert.equal(calls.update, 0);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'RESOURCE_MODIFIED',
        message: 'The assessment was modified by another session.',
        details: [],
      },
    });
  } finally {
    await server.close();
  }
}

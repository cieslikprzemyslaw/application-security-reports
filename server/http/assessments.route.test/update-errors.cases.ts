import assert from 'node:assert/strict';

import {
  RepositoryNotFoundError,
  startTestServer,
  readJson,
  defaultAssessment,
  createAssessmentRepository,
  createCompanyRepository,
  createApp,
  type ApiErrorBody,
} from './support.js';

{
  const { calls, repository } = createAssessmentRepository({
    update: async () => {
      throw new RepositoryNotFoundError();
    },
  });
  const { repository: companyRepository } = createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/assessments/${defaultAssessment.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Updated Assessment',
        }),
      },
    );

    assert.equal(response.status, 404);
    assert.equal(calls.update, 1);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'ASSESSMENT_NOT_FOUND',
        message: 'Assessment not found',
        details: [],
      },
    });
  } finally {
    await server.close();
  }
}

{
  const { repository } = createAssessmentRepository({
    update: async () => {
      throw new Error('boom');
    },
  });
  const { repository: companyRepository } = createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/assessments/${defaultAssessment.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Updated Assessment',
        }),
      },
    );

    assert.equal(response.status, 500);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'INTERNAL_SERVER_ERROR');
    assert.equal(JSON.stringify(body).includes('boom'), false);
  } finally {
    await server.close();
  }
}

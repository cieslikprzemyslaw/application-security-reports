import assert from 'node:assert/strict';

import {
  RepositoryConstraintError,
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
    delete: async () => undefined,
  });
  const { repository: companyRepository } = createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/assessments/${defaultAssessment.id}`,
      {
        method: 'DELETE',
      },
    );

    assert.equal(response.status, 204);
    assert.equal(await response.text(), '');
    assert.equal(calls.delete, 1);
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createAssessmentRepository({
    delete: async () => {
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
        method: 'DELETE',
      },
    );

    assert.equal(response.status, 404);
    assert.equal(calls.delete, 1);
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
  const { calls, repository } = createAssessmentRepository({
    delete: async () => {
      throw new RepositoryConstraintError();
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
        method: 'DELETE',
      },
    );

    assert.equal(response.status, 409);
    assert.equal(calls.delete, 1);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'ASSESSMENT_DELETE_CONFLICT',
        message: 'Assessment cannot be deleted while related reports exist',
        details: [],
      },
    });
  } finally {
    await server.close();
  }
}

{
  const { repository } = createAssessmentRepository({
    delete: async () => {
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
        method: 'DELETE',
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

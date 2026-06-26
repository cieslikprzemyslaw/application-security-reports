import assert from 'node:assert/strict';

import {
  startTestServer,
  readJson,
  createAssessmentRepository,
  createCompanyRepository,
  createApp,
  type ApiErrorBody,
} from './support.js';

{
  const { calls, repository } = createAssessmentRepository();
  const { repository: companyRepository } = createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(`${server.baseUrl}/api/assessments/not-an-id`);

    assert.equal(response.status, 400);
    assert.equal(calls.findById, 0);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: [
          {
            path: 'id',
            message: 'Assessment ID must be a prefixed UUID',
            code: 'invalid_string',
          },
        ],
      },
    });
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createAssessmentRepository();
  const { repository: companyRepository } = createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/assessments?companyId=bad-company`,
    );

    assert.equal(response.status, 400);
    assert.equal(calls.findAll, 0);
    assert.equal(calls.findByCompanyId, 0);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: [
          {
            path: 'companyId',
            message: 'Company ID must be a prefixed UUID',
            code: 'invalid_string',
          },
        ],
      },
    });
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createAssessmentRepository();
  const { repository: companyRepository } = createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/assessments?unexpected=1`,
    );

    assert.equal(response.status, 400);
    assert.equal(calls.findAll, 0);
    assert.equal(calls.findByCompanyId, 0);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(
      body.error.details.some(
        detail =>
          detail.path === 'unexpected' &&
          detail.message.includes('Unknown property'),
      ),
    );
  } finally {
    await server.close();
  }
}

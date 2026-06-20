import assert from 'node:assert/strict';

import {
  startTestServer,
  readJson,
  defaultCompany,
  defaultAssessment,
  createAssessmentRepository,
  createCompanyRepository,
  createApp,
  type ApiErrorBody,
} from './support.js';

{
  const { calls, repository } = createAssessmentRepository({
    findAll: async () => [defaultAssessment],
  });
  const { repository: companyRepository } = createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(`${server.baseUrl}/api/assessments`);

    assert.equal(response.status, 200);
    assert.deepEqual(
      await readJson<{ data: Array<typeof defaultAssessment> }>(response),
      {
        data: [defaultAssessment],
      },
    );
    assert.equal(calls.findAll, 1);
    assert.equal(calls.findByCompanyId, 0);
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createAssessmentRepository({
    findByCompanyId: async () => [defaultAssessment],
  });
  const { repository: companyRepository } = createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/assessments?companyId=${defaultCompany.id}`,
    );

    assert.equal(response.status, 200);
    assert.deepEqual(
      await readJson<{ data: Array<typeof defaultAssessment> }>(response),
      {
        data: [defaultAssessment],
      },
    );
    assert.equal(calls.findAll, 0);
    assert.equal(calls.findByCompanyId, 1);
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createAssessmentRepository({
    findById: async () => defaultAssessment,
  });
  const { repository: companyRepository } = createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/assessments/${defaultAssessment.id}`,
    );

    assert.equal(response.status, 200);
    assert.deepEqual(
      await readJson<{ data: typeof defaultAssessment }>(response),
      {
        data: defaultAssessment,
      },
    );
    assert.equal(calls.findById, 1);
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createAssessmentRepository({
    findById: async () => ({
      ...defaultAssessment,
      applicationName: null,
    }),
  });
  const { repository: companyRepository } = createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/assessments/${defaultAssessment.id}`,
    );

    assert.equal(response.status, 200);
    const body = await readJson<{
      data: typeof defaultAssessment & { applicationName: string | null };
    }>(response);
    assert.equal(body.data.applicationName, null);
    assert.equal(calls.findById, 1);
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createAssessmentRepository({
    findById: async () => null,
  });
  const { repository: companyRepository } = createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/assessments/${defaultAssessment.id}`,
    );

    assert.equal(response.status, 404);
    assert.equal(calls.findById, 1);
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
    create: async input => ({
      ...defaultAssessment,
      ...input,
    }),
  });
  const { calls: companyCalls, repository: companyRepository } =
    createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(`${server.baseUrl}/api/assessments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companyId: defaultCompany.id,
        title: 'Example Assessment',
        status: 'draft',
        applicationName: ' Customer Website ',
      }),
    });

    assert.equal(response.status, 201);
    assert.equal(
      response.headers.get('location'),
      `/api/assessments/${defaultAssessment.id}`,
    );
    const body = await readJson<{ data: typeof defaultAssessment }>(response);
    assert.equal(body.data.applicationName, 'Customer Website');
    assert.equal(calls.create, 1);
    assert.equal(companyCalls.findById, 1);
    assert.equal(calls.createArgs?.input.applicationName, 'Customer Website');
  } finally {
    await server.close();
  }
}

for (const applicationName of [undefined, '   '] as const) {
  const { calls, repository } = createAssessmentRepository();
  const { calls: companyCalls, repository: companyRepository } =
    createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(`${server.baseUrl}/api/assessments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companyId: defaultCompany.id,
        title: 'Example Assessment',
        status: 'draft',
        applicationName,
      }),
    });

    assert.equal(response.status, 400);
    assert.equal(calls.create, 0);
    assert.equal(companyCalls.findById, 0);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(
      body.error.details.some(
        detail =>
          detail.path === 'applicationName' &&
          detail.message.includes(
            applicationName === undefined ? 'Required' : 'Text is required',
          ),
      ),
    );
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

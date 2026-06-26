import assert from 'node:assert/strict';

import {
  startTestServer,
  readJson,
  defaultCompany,
  defaultCompanyResponse,
  createCompanyRepository,
  createApp,
  type ApiErrorBody,
} from './support.js';

{
  const { calls, repository } = createCompanyRepository({
    findAll: async () => [defaultCompany],
  });
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(`${server.baseUrl}/api/companies`);

    assert.equal(response.status, 200);
    assert.deepEqual(
      await readJson<{ data: Array<typeof defaultCompanyResponse> }>(response),
      {
        data: [defaultCompanyResponse],
      },
    );
    assert.equal(calls.findAll, 1);
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createCompanyRepository({
    findAll: async () => [],
  });
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(`${server.baseUrl}/api/companies`);

    assert.equal(response.status, 200);
    assert.deepEqual(await readJson<{ data: [] }>(response), {
      data: [],
    });
    assert.equal(calls.findAll, 1);
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createCompanyRepository({
    findById: async () => defaultCompany,
  });
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}`,
    );

    assert.equal(response.status, 200);
    assert.deepEqual(
      await readJson<{ data: typeof defaultCompanyResponse }>(response),
      {
        data: defaultCompanyResponse,
      },
    );
    assert.equal(calls.findById, 1);
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createCompanyRepository({
    findById: async () => null,
  });
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}`,
    );

    assert.equal(response.status, 404);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'COMPANY_NOT_FOUND',
        message: 'Company not found',
        details: [],
      },
    });
    assert.equal(calls.findById, 1);
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createCompanyRepository();
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(`${server.baseUrl}/api/companies/not-an-id`);

    assert.equal(response.status, 400);
    assert.equal(calls.findById, 0);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: [
          {
            path: 'id',
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
  const { repository } = createCompanyRepository({
    findById: async () => {
      throw new Error('boom');
    },
  });
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}`,
    );

    assert.equal(response.status, 500);
    const body = await readJson<ApiErrorBody>(response);
    assert.deepEqual(body, {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unexpected server error',
        details: [],
      },
    });
    assert.equal(JSON.stringify(body).includes('boom'), false);
  } finally {
    await server.close();
  }
}

import assert from 'node:assert/strict';

import {
  startTestServer,
  readJson,
  defaultCompany,
  defaultOverview,
  defaultOverviewResponse,
  createCompanyRepository,
  createApp,
  type ApiErrorBody,
} from './support.js';

{
  const { calls, repository } = createCompanyRepository({
    findOverview: async () => defaultOverview,
  });
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}/overview`,
    );

    assert.equal(response.status, 200);
    assert.deepEqual(
      await readJson<{ data: typeof defaultOverviewResponse }>(response),
      {
        data: defaultOverviewResponse,
      },
    );
    assert.equal(calls.findOverview, 1);
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createCompanyRepository({
    findOverview: async () => null,
  });
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}/overview`,
    );

    assert.equal(response.status, 404);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'COMPANY_NOT_FOUND',
        message: 'Company not found',
        details: [],
      },
    });
    assert.equal(calls.findOverview, 1);
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createCompanyRepository();
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/not-an-id/overview`,
    );

    assert.equal(response.status, 400);
    assert.equal(calls.findOverview, 0);
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
    findOverview: async () => {
      throw new Error('boom');
    },
  });
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}/overview`,
    );

    assert.equal(response.status, 500);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'INTERNAL_SERVER_ERROR');
    assert.equal(JSON.stringify(body).includes('boom'), false);
  } finally {
    await server.close();
  }
}

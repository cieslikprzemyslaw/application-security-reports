import assert from 'node:assert/strict';

import {
  RepositoryConstraintError,
  RepositoryNotFoundError,
  startTestServer,
  readJson,
  defaultCompany,
  createCompanyRepository,
  createApp,
  type ApiErrorBody,
} from './support.js';

{
  const { calls, repository } = createCompanyRepository({
    delete: async () => undefined,
  });
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}`,
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
  const { calls, repository } = createCompanyRepository({
    delete: async () => {
      throw new RepositoryNotFoundError();
    },
  });
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}`,
      {
        method: 'DELETE',
      },
    );

    assert.equal(response.status, 404);
    assert.equal(calls.delete, 1);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'COMPANY_NOT_FOUND',
        message: 'Company not found',
        details: [],
      },
    });
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createCompanyRepository({
    delete: async () => {
      throw new RepositoryConstraintError();
    },
  });
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}`,
      {
        method: 'DELETE',
      },
    );

    assert.equal(response.status, 409);
    assert.equal(calls.delete, 1);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'COMPANY_DELETE_CONFLICT',
        message: 'Company cannot be deleted while related assessments exist',
        details: [],
      },
    });
  } finally {
    await server.close();
  }
}

{
  const { repository } = createCompanyRepository({
    delete: async () => {
      throw new Error('boom');
    },
  });
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}`,
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

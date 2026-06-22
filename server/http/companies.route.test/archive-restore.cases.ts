import assert from 'node:assert/strict';

import {
  RepositoryNotFoundError,
  RepositoryStateError,
  startTestServer,
  readJson,
  defaultCompany,
  createCompanyRepository,
  createApp,
  type ApiErrorBody,
} from './support.js';

// Archive success
{
  const { calls, repository } = createCompanyRepository();
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}/archive`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{}',
      },
    );

    assert.equal(response.status, 200);
    const body = await readJson<{ data: { archivedAt: string | null } }>(
      response,
    );
    assert.equal(typeof body.data.archivedAt, 'string');
    assert.equal(calls.archive, 1);
  } finally {
    await server.close();
  }
}

// Archive already-archived returns 409 COMPANY_ALREADY_ARCHIVED
{
  const { calls, repository } = createCompanyRepository({
    archive: async () => {
      throw new RepositoryStateError('Company is already archived.');
    },
  });
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}/archive`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{}',
      },
    );

    assert.equal(response.status, 409);
    assert.equal(calls.archive, 1);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'COMPANY_ALREADY_ARCHIVED',
        message: 'Company is already archived',
        details: [],
      },
    });
  } finally {
    await server.close();
  }
}

// Archive non-existent company returns 404
{
  const { calls, repository } = createCompanyRepository({
    archive: async () => {
      throw new RepositoryNotFoundError();
    },
  });
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}/archive`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{}',
      },
    );

    assert.equal(response.status, 404);
    assert.equal(calls.archive, 1);
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

// Archive with invalid ID returns 400
{
  const { calls, repository } = createCompanyRepository();
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/not-an-id/archive`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{}',
      },
    );

    assert.equal(response.status, 400);
    assert.equal(calls.archive, 0);
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

// Archive unexpected error returns 500
{
  const { repository } = createCompanyRepository({
    archive: async () => {
      throw new Error('boom');
    },
  });
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}/archive`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{}',
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

// Restore success
{
  const { calls, repository } = createCompanyRepository({
    restore: async id => ({
      ...defaultCompany,
      id,
      archivedAt: null,
    }),
  });
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}/restore`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{}',
      },
    );

    assert.equal(response.status, 200);
    const body = await readJson<{ data: { archivedAt: string | null } }>(
      response,
    );
    assert.equal(body.data.archivedAt, null);
    assert.equal(calls.restore, 1);
  } finally {
    await server.close();
  }
}

// Restore non-archived company returns 409 COMPANY_NOT_ARCHIVED
{
  const { calls, repository } = createCompanyRepository({
    restore: async () => {
      throw new RepositoryStateError('Company is not archived.');
    },
  });
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}/restore`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{}',
      },
    );

    assert.equal(response.status, 409);
    assert.equal(calls.restore, 1);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'COMPANY_NOT_ARCHIVED',
        message: 'Company is not archived',
        details: [],
      },
    });
  } finally {
    await server.close();
  }
}

// Restore non-existent company returns 404
{
  const { calls, repository } = createCompanyRepository({
    restore: async () => {
      throw new RepositoryNotFoundError();
    },
  });
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}/restore`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{}',
      },
    );

    assert.equal(response.status, 404);
    assert.equal(calls.restore, 1);
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

// Restore with invalid ID returns 400
{
  const { calls, repository } = createCompanyRepository();
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/not-an-id/restore`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{}',
      },
    );

    assert.equal(response.status, 400);
    assert.equal(calls.restore, 0);
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

// Restore unexpected error returns 500
{
  const { repository } = createCompanyRepository({
    restore: async () => {
      throw new Error('boom');
    },
  });
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}/restore`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{}',
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

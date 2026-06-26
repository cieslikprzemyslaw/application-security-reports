import assert from 'node:assert/strict';

import {
  RepositoryConflictError,
  startTestServer,
  readJson,
  defaultCompanyResponse,
  createCompanyRepository,
  createApp,
  type ApiErrorBody,
} from './support.js';

{
  const { calls, repository } = createCompanyRepository();
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(`${server.baseUrl}/api/companies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Example Security',
        description: 'AppSec consulting',
        website: 'https://example.example',
        contactName: 'Ada Lovelace',
        contactEmail: 'ada@example.com',
        footerText: 'Confidential',
      }),
    });

    assert.equal(response.status, 201);
    assert.ok(
      response.headers.get('location')?.startsWith('/api/companies/cmp_'),
    );
    const body = await readJson<{ data: typeof defaultCompanyResponse }>(
      response,
    );
    assert.equal(body.data.name, 'Example Security');
    assert.equal(body.data.id.startsWith('cmp_'), true);
    assert.equal(body.data.logoUrl, defaultCompanyResponse.logoUrl);
    assert.equal(calls.create, 1);
    assert.equal(calls.createArgs?.input.name, 'Example Security');
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createCompanyRepository({
    create: async () => {
      throw new RepositoryConflictError();
    },
  });
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(`${server.baseUrl}/api/companies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Example Security',
      }),
    });

    assert.equal(response.status, 409);
    assert.equal(calls.create, 1);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'COMPANY_CONFLICT',
        message: 'A company with the same unique value already exists',
        details: [],
      },
    });
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createCompanyRepository();
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(`${server.baseUrl}/api/companies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'cmp_client_controlled',
        name: 'Example Security',
      }),
    });

    assert.equal(response.status, 400);
    assert.equal(calls.create, 0);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: [
          {
            path: 'id',
            message: 'Unknown property: id',
            code: 'unrecognized_keys',
          },
        ],
      },
    });
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createCompanyRepository();
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(`${server.baseUrl}/api/companies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: '',
      }),
    });

    assert.equal(response.status, 400);
    assert.equal(calls.create, 0);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(
      body.error.details.some(
        (detail: { path: string; message: string }) =>
          detail.path === 'name' && detail.message.includes('Text is required'),
      ),
    );
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createCompanyRepository();
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(`${server.baseUrl}/api/companies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Example Security',
        website: 123,
      }),
    });

    assert.equal(response.status, 400);
    assert.equal(calls.create, 0);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(
      body.error.details.some(
        (detail: { path: string; message: string }) =>
          detail.path === 'website' &&
          detail.message.includes('Expected string'),
      ),
    );
  } finally {
    await server.close();
  }
}

{
  const { repository } = createCompanyRepository({
    create: async () => {
      throw new Error('boom');
    },
  });
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(`${server.baseUrl}/api/companies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Example Security',
      }),
    });

    assert.equal(response.status, 500);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'INTERNAL_SERVER_ERROR');
    assert.equal(JSON.stringify(body).includes('boom'), false);
  } finally {
    await server.close();
  }
}

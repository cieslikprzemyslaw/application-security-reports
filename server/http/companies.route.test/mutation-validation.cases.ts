import assert from 'node:assert/strict';

import {
  startTestServer,
  readJson,
  defaultCompany,
  createCompanyRepository,
  createApp,
  type ApiErrorBody,
} from './support.js';

{
  const { calls, repository } = createCompanyRepository();
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 'cmp_client_controlled',
        }),
      },
    );

    assert.equal(response.status, 400);
    assert.equal(calls.update, 0);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(
      body.error.details.some(
        (detail: { path: string; message: string }) =>
          detail.path === 'id' &&
          detail.message.includes('Unknown property: id'),
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
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      },
    );

    assert.equal(response.status, 400);
    assert.equal(calls.update, 0);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(
      body.error.details.some((detail: { path: string; message: string }) =>
        detail.message.includes('At least one company field is required'),
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
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          createdAt: '2026-06-12T00:00:00.000Z',
        }),
      },
    );

    assert.equal(response.status, 400);
    assert.equal(calls.update, 0);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(
      body.error.details.some(
        (detail: { path: string; message: string }) =>
          detail.path === 'createdAt' &&
          detail.message.includes('Unknown property'),
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
        unknownField: '/logos/example.svg',
      }),
    });

    assert.equal(response.status, 400);
    assert.equal(calls.create, 0);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(
      body.error.details.some(
        (detail: { path: string; message: string }) =>
          detail.path === 'unknownField' &&
          detail.message.includes('Unknown property'),
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
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logoUrl: 'https://example.example/logo.svg',
        }),
      },
    );

    assert.equal(response.status, 400);
    assert.equal(calls.update, 0);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(
      body.error.details.some(
        (detail: { path: string; message: string }) =>
          detail.path === 'logoUrl' &&
          detail.message.includes('Unknown property'),
      ),
    );
  } finally {
    await server.close();
  }
}

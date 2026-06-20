import assert from 'node:assert/strict';

import {
  RepositoryConflictError,
  RepositoryConstraintError,
  RepositoryNotFoundError,
  CompanyLogoValidationError,
  CompanyLogoStorageError,
  startTestServer,
  readJson,
  defaultCompany,
  defaultCompanyResponse,
  defaultOverview,
  defaultOverviewResponse,
  createCompanyRepository,
  createMockLogoStorage,
  defaultStorageKey,
  defaultLogoBuffer,
  createApp,
  type ApiErrorBody,
} from './support.js';

// --- Logo route tests ---

const pngMagicBytes = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00,
]);

// PUT /:id/logo — success
{
  const { calls, repository } = createCompanyRepository({
    findById: async () => defaultCompany,
    updateLogoUrl: async (_id, logoUrl) => ({ ...defaultCompany, logoUrl }),
  });
  const logoStorage = createMockLogoStorage();
  const server = await startTestServer(createApp(repository, logoStorage));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}/logo`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/png',
          'X-File-Name': 'logo.png',
        },
        body: pngMagicBytes,
      },
    );

    assert.equal(response.status, 200);
    const body = await readJson<{ data: { logoUrl: string | null } }>(response);
    assert.ok(
      typeof body.data.logoUrl === 'string' &&
        body.data.logoUrl.includes(`/api/companies/${defaultCompany.id}/logo`),
    );
    assert.equal(calls.findById, 1);
    assert.equal(calls.updateLogoUrl, 1);
    assert.equal(calls.updateLogoUrlArgs?.id, defaultCompany.id);
  } finally {
    await server.close();
  }
}

// PUT /:id/logo — company not found
{
  const { calls, repository } = createCompanyRepository({
    findById: async () => null,
  });
  const logoStorage = createMockLogoStorage();
  const server = await startTestServer(createApp(repository, logoStorage));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}/logo`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/png',
          'X-File-Name': 'logo.png',
        },
        body: pngMagicBytes,
      },
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
    assert.equal(calls.updateLogoUrl, 0);
  } finally {
    await server.close();
  }
}

// PUT /:id/logo — validation error (mocked)
{
  const { calls, repository } = createCompanyRepository({
    findById: async () => defaultCompany,
  });
  const logoStorage = createMockLogoStorage({
    validateCompanyLogoFile: () => {
      throw new CompanyLogoValidationError(
        'Company logo file type is not supported',
      );
    },
  });
  const server = await startTestServer(createApp(repository, logoStorage));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}/logo`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/png',
          'X-File-Name': 'logo.png',
        },
        body: pngMagicBytes,
      },
    );

    assert.equal(response.status, 422);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'LOGO_VALIDATION_ERROR');
    assert.equal(calls.updateLogoUrl, 0);
  } finally {
    await server.close();
  }
}

// PUT /:id/logo — empty body (422)
{
  const { calls, repository } = createCompanyRepository({
    findById: async () => defaultCompany,
  });
  const logoStorage = createMockLogoStorage();
  const server = await startTestServer(createApp(repository, logoStorage));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}/logo`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/png',
          'X-File-Name': 'logo.png',
          'Content-Length': '0',
        },
        body: Buffer.alloc(0),
      },
    );

    assert.equal(response.status, 422);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'LOGO_VALIDATION_ERROR');
    assert.equal(calls.updateLogoUrl, 0);
  } finally {
    await server.close();
  }
}

// PUT /:id/logo — wrong content type (415)
{
  const { repository } = createCompanyRepository();
  const logoStorage = createMockLogoStorage();
  const server = await startTestServer(createApp(repository, logoStorage));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}/logo`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'text/plain' },
        body: 'not an image',
      },
    );

    assert.equal(response.status, 415);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'UNSUPPORTED_MEDIA_TYPE');
  } finally {
    await server.close();
  }
}

// PUT /:id/logo — invalid param (400)
{
  const { calls, repository } = createCompanyRepository();
  const logoStorage = createMockLogoStorage();
  const server = await startTestServer(createApp(repository, logoStorage));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/not-an-id/logo`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/png',
          'X-File-Name': 'logo.png',
        },
        body: pngMagicBytes,
      },
    );

    assert.equal(response.status, 400);
    assert.equal(calls.findById, 0);
  } finally {
    await server.close();
  }
}

// PUT /:id/logo — storage error (500)
{
  const { repository } = createCompanyRepository({
    findById: async () => defaultCompany,
  });
  const logoStorage = createMockLogoStorage({
    stageCompanyLogoReplacement: async () => {
      throw new CompanyLogoStorageError('Failed to stage');
    },
  });
  const server = await startTestServer(createApp(repository, logoStorage));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}/logo`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/png',
          'X-File-Name': 'logo.png',
        },
        body: pngMagicBytes,
      },
    );

    assert.equal(response.status, 500);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'INTERNAL_SERVER_ERROR');
  } finally {
    await server.close();
  }
}

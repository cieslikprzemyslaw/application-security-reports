import assert from 'node:assert/strict';

import {
  CompanyLogoStorageError,
  startTestServer,
  readJson,
  defaultCompany,
  createCompanyRepository,
  createMockLogoStorage,
  defaultStorageKey,
  defaultLogoBuffer,
  createApp,
  type ApiErrorBody,
} from './support.js';

// GET /:id/logo — success
{
  const companyWithLogo = {
    ...defaultCompany,
    logoUrl: defaultStorageKey,
  };
  const { calls, repository } = createCompanyRepository({
    findById: async () => companyWithLogo,
  });
  const logoStorage = createMockLogoStorage({
    readCompanyLogoFile: async () => defaultLogoBuffer,
  });
  const server = await startTestServer(createApp(repository, logoStorage));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}/logo`,
    );

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/png');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.deepEqual(bytes, defaultLogoBuffer);
    assert.equal(calls.findById, 1);
  } finally {
    await server.close();
  }
}

// GET /:id/logo — no logo (404)
{
  const { calls, repository } = createCompanyRepository({
    findById: async () => defaultCompany,
  });
  const logoStorage = createMockLogoStorage();
  const server = await startTestServer(createApp(repository, logoStorage));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}/logo`,
    );

    assert.equal(response.status, 404);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'COMPANY_LOGO_NOT_FOUND',
        message: 'Company logo not found',
        details: [],
      },
    });
    assert.equal(calls.findById, 1);
  } finally {
    await server.close();
  }
}

// GET /:id/logo — company not found (404)
{
  const { repository } = createCompanyRepository({
    findById: async () => null,
  });
  const logoStorage = createMockLogoStorage();
  const server = await startTestServer(createApp(repository, logoStorage));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}/logo`,
    );

    assert.equal(response.status, 404);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'COMPANY_NOT_FOUND');
  } finally {
    await server.close();
  }
}

// GET /:id/logo — invalid param (400)
{
  const { repository } = createCompanyRepository();
  const logoStorage = createMockLogoStorage();
  const server = await startTestServer(createApp(repository, logoStorage));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/not-an-id/logo`,
    );

    assert.equal(response.status, 400);
  } finally {
    await server.close();
  }
}

// DELETE /:id/logo — success with existing logo
{
  const companyWithLogo = {
    ...defaultCompany,
    logoUrl: defaultStorageKey,
  };
  const { calls, repository } = createCompanyRepository({
    findById: async () => companyWithLogo,
    updateLogoUrl: async () => ({ ...defaultCompany, logoUrl: null }),
  });
  const logoStorage = createMockLogoStorage();
  const server = await startTestServer(createApp(repository, logoStorage));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}/logo`,
      { method: 'DELETE' },
    );

    assert.equal(response.status, 204);
    assert.equal(await response.text(), '');
    assert.equal(calls.findById, 1);
    assert.equal(calls.updateLogoUrl, 1);
    assert.equal(calls.updateLogoUrlArgs?.logoUrl, null);
  } finally {
    await server.close();
  }
}

// DELETE /:id/logo — idempotent (no logo)
{
  const { calls, repository } = createCompanyRepository({
    findById: async () => defaultCompany,
    updateLogoUrl: async () => ({ ...defaultCompany, logoUrl: null }),
  });
  const logoStorage = createMockLogoStorage();
  const server = await startTestServer(createApp(repository, logoStorage));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}/logo`,
      { method: 'DELETE' },
    );

    assert.equal(response.status, 204);
    assert.equal(calls.findById, 1);
    assert.equal(calls.updateLogoUrl, 1);
  } finally {
    await server.close();
  }
}

// DELETE /:id/logo — company not found (404)
{
  const { calls, repository } = createCompanyRepository({
    findById: async () => null,
  });
  const logoStorage = createMockLogoStorage();
  const server = await startTestServer(createApp(repository, logoStorage));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}/logo`,
      { method: 'DELETE' },
    );

    assert.equal(response.status, 404);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'COMPANY_NOT_FOUND',
        message: 'Company not found',
        details: [],
      },
    });
    assert.equal(calls.updateLogoUrl, 0);
  } finally {
    await server.close();
  }
}

// DELETE /:id/logo — file cleanup warning does not fail the operation
{
  const companyWithLogo = {
    ...defaultCompany,
    logoUrl: defaultStorageKey,
  };
  const { calls, repository } = createCompanyRepository({
    findById: async () => companyWithLogo,
    updateLogoUrl: async () => ({ ...defaultCompany, logoUrl: null }),
  });
  const logoStorage = createMockLogoStorage({
    deleteCompanyLogoFile: async () => {
      throw new CompanyLogoStorageError('File not accessible');
    },
  });
  const server = await startTestServer(createApp(repository, logoStorage));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}/logo`,
      { method: 'DELETE' },
    );

    assert.equal(response.status, 204);
    assert.equal(calls.updateLogoUrl, 1);
  } finally {
    await server.close();
  }
}

// DELETE /:id/logo — invalid param (400)
{
  const { repository } = createCompanyRepository();
  const logoStorage = createMockLogoStorage();
  const server = await startTestServer(createApp(repository, logoStorage));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/not-an-id/logo`,
      { method: 'DELETE' },
    );

    assert.equal(response.status, 400);
  } finally {
    await server.close();
  }
}

console.log('companies API route checks passed');

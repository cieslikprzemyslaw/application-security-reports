import assert from 'node:assert/strict';
import { createServer } from 'node:http';

import { loadServerConfig } from '../config.js';
import {
  RepositoryConflictError,
  RepositoryConstraintError,
  RepositoryNotFoundError,
} from '../database/errors.js';
import type {
  CompanyOverview,
  CompanyRepository,
} from '../database/repositories/company.repository.js';
import {
  CompanyLogoValidationError,
  CompanyLogoStorageError,
  type CompanyLogoStorage,
} from '../services/companyLogoStorage.js';
import { createApiApp } from './api-app.js';

const allowedOrigin = 'http://localhost:5173';
const config = loadServerConfig({
  FRONTEND_ORIGIN: allowedOrigin,
});

const startTestServer = async (app: ReturnType<typeof createApiApp>) => {
  const server = createServer(app);

  await new Promise<void>(resolve => {
    server.listen(0, resolve);
  });

  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Expected the test server to listen on an ephemeral port.');
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: async () =>
      new Promise<void>((resolve, reject) => {
        server.close(error => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      }),
  };
};

type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details: Array<{ path: string; message: string; code?: string }>;
  };
};

const readJson = async <T>(response: Response): Promise<T> =>
  response.json() as Promise<T>;

const defaultCompany = {
  id: 'cmp_00000000-0000-0000-0000-000000000001',
  name: 'Northstar Digital',
  description: 'Security consulting and managed assessment services',
  website: 'https://northstar.example',
  contactName: 'Alex Mercer',
  contactEmail: 'security@northstar.example',
  logoUrl: null,
  footerText: 'Confidential - do not distribute.',
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-11T09:00:00.000Z',
};

const defaultCompanyResponse = { ...defaultCompany };

const defaultOverview: CompanyOverview = {
  company: defaultCompany,
  assessmentCounts: { total: 2, draft: 1, inProgress: 1, completed: 0 },
  recentAssessments: [
    {
      id: 'asm_00000000-0000-0000-0000-000000000001',
      applicationName: 'Customer Portal',
      companyName: defaultCompany.name,
      assessmentType: 'Web App',
      severity: 'high',
      findingsCount: 3,
      status: 'in-progress',
    },
  ],
  recentReports: null,
};

const defaultOverviewResponse = {
  ...defaultOverview,
  company: defaultCompanyResponse,
};

type CompanyRepositoryOverrides = Partial<{
  findAll: () => Promise<Array<typeof defaultCompany>>;
  findById: (id: string) => Promise<typeof defaultCompany | null>;
  findOverview: (companyId: string) => Promise<CompanyOverview | null>;
  create: (
    input: Parameters<CompanyRepository['create']>[0],
    id?: string,
  ) => Promise<typeof defaultCompany>;
  update: (
    id: string,
    input: Parameters<CompanyRepository['update']>[1],
  ) => Promise<typeof defaultCompany>;
  updateLogoUrl: (
    id: string,
    logoUrl: string | null,
  ) => Promise<typeof defaultCompany>;
  delete: (id: string) => Promise<void>;
}>;

const createCompanyRepository = (
  overrides: CompanyRepositoryOverrides = {},
) => {
  const calls = {
    findAll: 0,
    findById: 0,
    findOverview: 0,
    create: 0,
    update: 0,
    updateLogoUrl: 0,
    delete: 0,
    createArgs: undefined as
      | {
          input: Parameters<CompanyRepository['create']>[0];
          id?: string;
        }
      | undefined,
    updateArgs: undefined as
      | {
          id: string;
          input: Parameters<CompanyRepository['update']>[1];
        }
      | undefined,
    updateLogoUrlArgs: undefined as
      | { id: string; logoUrl: string | null }
      | undefined,
  };

  const repository: CompanyRepository = {
    async findAll() {
      calls.findAll += 1;
      return overrides.findAll?.() ?? [defaultCompany];
    },

    async findById(id) {
      calls.findById += 1;
      return overrides.findById?.(id) ?? defaultCompany;
    },

    async findOverview(companyId) {
      calls.findOverview += 1;
      return overrides.findOverview?.(companyId) ?? defaultOverview;
    },

    async create(input, id) {
      calls.create += 1;
      calls.createArgs = { input, id };
      const resolvedId = id ?? defaultCompany.id;

      return (
        (await overrides.create?.(input, id)) ?? {
          ...defaultCompany,
          id: resolvedId,
          ...input,
        }
      );
    },

    async update(id, input) {
      calls.update += 1;
      calls.updateArgs = { id, input };
      return (
        (await overrides.update?.(id, input)) ?? {
          ...defaultCompany,
          id,
          ...input,
        }
      );
    },

    async updateLogoUrl(id, logoUrl) {
      calls.updateLogoUrl += 1;
      calls.updateLogoUrlArgs = { id, logoUrl };
      return (
        (await overrides.updateLogoUrl?.(id, logoUrl)) ?? {
          ...defaultCompany,
          id,
          logoUrl,
        }
      );
    },

    async delete(id) {
      calls.delete += 1;
      return overrides.delete?.(id);
    },
  };

  return { calls, repository };
};

type MockLogoStorageOverrides = Partial<{
  validateCompanyLogoFile: (
    input: Parameters<CompanyLogoStorage['validateCompanyLogoFile']>[0],
  ) => ReturnType<CompanyLogoStorage['validateCompanyLogoFile']>;
  buildCompanyLogoStorageKey: (
    companyId: string,
    fileName: string,
    logoId?: string,
  ) => string;
  readCompanyLogoFile: (storageKey: string) => Promise<Buffer>;
  deleteCompanyLogoFile: (storageKey: string) => Promise<void>;
  stageCompanyLogoReplacement: (
    input: Parameters<CompanyLogoStorage['stageCompanyLogoReplacement']>[0],
  ) => Promise<void>;
}>;

const defaultStorageKey = `uploads/company-logos/${defaultCompany.id}/logo_test.png`;
const defaultLogoBuffer = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

const createMockLogoStorage = (
  overrides: MockLogoStorageOverrides = {},
): CompanyLogoStorage => ({
  validateCompanyLogoFile(input) {
    return (
      overrides.validateCompanyLogoFile?.(input) ?? {
        fileName: input.fileName,
        mimeType: 'image/png' as const,
        sizeBytes: input.sizeBytes,
      }
    );
  },
  buildCompanyLogoStorageKey(companyId, fileName, logoId) {
    return (
      overrides.buildCompanyLogoStorageKey?.(companyId, fileName, logoId) ??
      defaultStorageKey
    );
  },
  async readCompanyLogoFile(storageKey) {
    return overrides.readCompanyLogoFile?.(storageKey) ?? defaultLogoBuffer;
  },
  async deleteCompanyLogoFile(storageKey) {
    return overrides.deleteCompanyLogoFile?.(storageKey);
  },
  async stageCompanyLogoReplacement(input) {
    return overrides.stageCompanyLogoReplacement?.(input);
  },
});

const createApp = (
  repository: CompanyRepository,
  logoStorage?: CompanyLogoStorage,
) =>
  createApiApp(config, {
    companyRepository: repository,
    logoStorage,
  });

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

{
  const { calls, repository } = createCompanyRepository({
    update: async (_id, input) => ({
      ...defaultCompany,
      ...input,
    }),
  });
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
          name: 'Northstar Security',
        }),
      },
    );

    assert.equal(response.status, 200);
    const body = await readJson<{ data: typeof defaultCompanyResponse }>(
      response,
    );
    assert.equal(body.data.name, 'Northstar Security');
    assert.equal(body.data.website, defaultCompany.website);
    assert.equal(body.data.logoUrl, defaultCompanyResponse.logoUrl);
    assert.equal(calls.update, 1);
    assert.equal(calls.updateArgs?.id, defaultCompany.id);
    assert.equal(calls.updateArgs?.input.name, 'Northstar Security');
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createCompanyRepository({
    update: async (_id, input) => ({
      ...defaultCompany,
      ...input,
      website: 'https://northstar.example',
    }),
  });
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
          name: 'Northstar Security',
          contactEmail: 'security-team@example.com',
        }),
      },
    );

    assert.equal(response.status, 200);
    const body = await readJson<{ data: typeof defaultCompanyResponse }>(
      response,
    );
    assert.equal(body.data.name, 'Northstar Security');
    assert.equal(body.data.contactEmail, 'security-team@example.com');
    assert.equal(body.data.logoUrl, defaultCompanyResponse.logoUrl);
    assert.equal(calls.update, 1);
    assert.equal(calls.updateArgs?.input.name, 'Northstar Security');
    assert.equal(
      calls.updateArgs?.input.contactEmail,
      'security-team@example.com',
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

{
  const { calls, repository } = createCompanyRepository({
    update: async () => {
      throw new RepositoryNotFoundError();
    },
  });
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
          name: 'Northstar Security',
        }),
      },
    );

    assert.equal(response.status, 404);
    assert.equal(calls.update, 1);
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
  const { repository } = createCompanyRepository({
    update: async () => {
      throw new Error('boom');
    },
  });
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
          name: 'Northstar Security',
        }),
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

{
  const { calls, repository } = createCompanyRepository();
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(`${server.baseUrl}/api/companies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{',
    });

    assert.equal(response.status, 400);
    assert.equal(calls.create, 0);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'INVALID_JSON',
        message: 'Malformed JSON request body',
        details: [],
      },
    });
  } finally {
    await server.close();
  }
}

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

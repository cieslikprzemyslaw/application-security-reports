import assert from 'node:assert/strict';
import { createServer } from 'node:http';

import {
  RepositoryConstraintError,
  RepositoryNotFoundError,
} from '../database/errors.js';
import type { AssessmentRepository } from '../database/repositories/assessment.repository.js';
import type { CompanyRepository } from '../database/repositories/company.repository.js';
import type { Assessment } from '../../src/domain/assessment.js';
import { OWASP_TOP_10_CURRENT_VERSION } from '../../src/domain/owaspTop10.js';
import { loadServerConfig } from '../config.js';
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

const defaultAssessment: Assessment = {
  id: 'asm_00000000-0000-0000-0000-000000000001',
  companyId: defaultCompany.id,
  title: 'Customer Services Portal',
  description: 'Assessment of the customer portal',
  scope: 'Web application',
  status: 'in-progress',
  startedAt: '2026-06-01',
  completedAt: '2026-06-10',
  applicationName: 'Customer Services Portal',
  environment: 'Production',
  assessmentType: 'Web App',
  overallRisk: 'high',
  owaspTaxonomyVersion: OWASP_TOP_10_CURRENT_VERSION,
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-11T09:00:00.000Z',
};

type AssessmentRepositoryOverrides = Partial<{
  findAll: () => Promise<Array<typeof defaultAssessment>>;
  findById: (id: string) => Promise<typeof defaultAssessment | null>;
  findByCompanyId: (
    companyId: string,
  ) => Promise<Array<typeof defaultAssessment>>;
  create: (
    input: Parameters<AssessmentRepository['create']>[0],
  ) => Promise<typeof defaultAssessment>;
  update: (
    id: string,
    input: Parameters<AssessmentRepository['update']>[1],
  ) => Promise<typeof defaultAssessment>;
  delete: (id: string) => Promise<void>;
}>;

type CompanyRepositoryOverrides = Partial<{
  findById: (id: string) => Promise<typeof defaultCompany | null>;
}>;

const createAssessmentRepository = (
  overrides: AssessmentRepositoryOverrides = {},
) => {
  const calls = {
    findAll: 0,
    findById: 0,
    findByCompanyId: 0,
    create: 0,
    update: 0,
    delete: 0,
    createArgs: undefined as
      | {
          input: Parameters<AssessmentRepository['create']>[0];
        }
      | undefined,
    updateArgs: undefined as
      | {
          id: string;
          input: Parameters<AssessmentRepository['update']>[1];
        }
      | undefined,
  };

  const repository: AssessmentRepository = {
    async findAll() {
      calls.findAll += 1;
      return overrides.findAll?.() ?? [defaultAssessment];
    },

    async findById(id) {
      calls.findById += 1;
      return overrides.findById?.(id) ?? defaultAssessment;
    },

    async findByCompanyId(companyId) {
      calls.findByCompanyId += 1;
      return overrides.findByCompanyId?.(companyId) ?? [defaultAssessment];
    },

    async create(input) {
      calls.create += 1;
      calls.createArgs = { input };
      return (
        (await overrides.create?.(input)) ?? {
          ...defaultAssessment,
          ...input,
        }
      );
    },

    async update(id, input) {
      calls.update += 1;
      calls.updateArgs = { id, input };
      return (
        (await overrides.update?.(id, input)) ?? {
          ...defaultAssessment,
          id,
          ...input,
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

const createCompanyRepository = (
  overrides: CompanyRepositoryOverrides = {},
) => {
  const calls = {
    findById: 0,
  };

  const repository: CompanyRepository = {
    async findAll() {
      return [defaultCompany];
    },

    async findById(id) {
      calls.findById += 1;
      return overrides.findById?.(id) ?? defaultCompany;
    },

    async findOverview() {
      return null;
    },

    async create(input, id) {
      return {
        ...defaultCompany,
        id: id ?? defaultCompany.id,
        ...input,
      };
    },

    async update(id, input) {
      return {
        ...defaultCompany,
        id,
        ...input,
      };
    },

    async delete() {
      return undefined;
    },
  };

  return { calls, repository };
};

const createApp = (
  assessmentRepository: AssessmentRepository,
  companyRepository: CompanyRepository,
) =>
  createApiApp(config, {
    assessmentRepository,
    companyRepository,
  });

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

{
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
      }),
    });

    assert.equal(response.status, 201);
    assert.equal(companyCalls.findById, 1);
    assert.equal(
      response.headers.get('location'),
      `/api/assessments/${defaultAssessment.id}`,
    );
    const body = await readJson<{ data: typeof defaultAssessment }>(response);
    assert.equal(body.data.id.startsWith('asm_'), true);
    assert.equal(body.data.title, 'Example Assessment');
    assert.equal(body.data.owaspTaxonomyVersion, OWASP_TOP_10_CURRENT_VERSION);
    assert.equal(calls.create, 1);
    assert.equal(calls.createArgs?.input.companyId, defaultCompany.id);
    assert.equal(
      (calls.createArgs?.input as { owaspTaxonomyVersion?: string } | undefined)
        ?.owaspTaxonomyVersion,
      undefined,
    );
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createAssessmentRepository();
  const { calls: companyCalls, repository: companyRepository } =
    createCompanyRepository({
      findById: async () => null,
    });
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
      }),
    });

    assert.equal(response.status, 404);
    assert.equal(calls.create, 0);
    assert.equal(companyCalls.findById, 1);
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
  const { calls, repository } = createAssessmentRepository();
  const { repository: companyRepository } = createCompanyRepository();
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
        id: 'asm_client_controlled',
        companyId: defaultCompany.id,
        title: 'Example Assessment',
        status: 'draft',
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
  const { calls, repository } = createAssessmentRepository();
  const { repository: companyRepository } = createCompanyRepository();
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
        title: '',
        status: 'draft',
      }),
    });

    assert.equal(response.status, 400);
    assert.equal(calls.create, 0);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(
      body.error.details.some(
        detail =>
          detail.path === 'title' &&
          detail.message.includes('Text is required'),
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
    const response = await fetch(`${server.baseUrl}/api/assessments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companyId: defaultCompany.id,
        title: 'Example Assessment',
        status: 'draft',
        unknown: true,
      }),
    });

    assert.equal(response.status, 400);
    assert.equal(calls.create, 0);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(
      body.error.details.some(
        detail =>
          detail.path === 'unknown' &&
          detail.message.includes('Unknown property'),
      ),
    );
  } finally {
    await server.close();
  }
}

{
  const { repository } = createAssessmentRepository({
    create: async () => {
      throw new Error('boom');
    },
  });
  const { repository: companyRepository } = createCompanyRepository();
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
  const { calls, repository } = createAssessmentRepository({
    update: async (_id, input) => ({
      ...defaultAssessment,
      ...input,
    }),
  });
  const { repository: companyRepository } = createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/assessments/${defaultAssessment.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Updated Assessment',
          overallRisk: 'medium',
        }),
      },
    );

    assert.equal(response.status, 200);
    const body = await readJson<{ data: typeof defaultAssessment }>(response);
    assert.equal(body.data.title, 'Updated Assessment');
    assert.equal(body.data.overallRisk, 'medium');
    assert.equal(body.data.owaspTaxonomyVersion, OWASP_TOP_10_CURRENT_VERSION);
    assert.equal(calls.update, 1);
    assert.equal(calls.updateArgs?.id, defaultAssessment.id);
    assert.equal(calls.updateArgs?.input.title, 'Updated Assessment');
    assert.equal(
      (
        calls.updateArgs?.input as
          | {
              owaspTaxonomyVersion?: string;
            }
          | undefined
      )?.owaspTaxonomyVersion,
      undefined,
    );
  } finally {
    await server.close();
  }
}

for (const [field, body] of [
  ['id', { id: 'asm_client_controlled' }],
  ['companyId', { companyId: defaultCompany.id }],
  ['createdAt', { createdAt: '2026-06-12T00:00:00.000Z' }],
  ['updatedAt', { updatedAt: '2026-06-12T00:00:00.000Z' }],
] as const) {
  const { calls, repository } = createAssessmentRepository();
  const { repository: companyRepository } = createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/assessments/${defaultAssessment.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    assert.equal(response.status, 400);
    assert.equal(calls.update, 0);
    const responseBody = await readJson<ApiErrorBody>(response);
    assert.equal(responseBody.error.code, 'VALIDATION_ERROR');
    assert.ok(
      responseBody.error.details.some(
        detail =>
          detail.path === field && detail.message.includes('Unknown property'),
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
    const response = await fetch(
      `${server.baseUrl}/api/assessments/${defaultAssessment.id}`,
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
      body.error.details.some(detail =>
        detail.message.includes('At least one assessment field is required'),
      ),
    );
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createAssessmentRepository({
    update: async () => {
      throw new RepositoryNotFoundError();
    },
  });
  const { repository: companyRepository } = createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/assessments/${defaultAssessment.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Updated Assessment',
        }),
      },
    );

    assert.equal(response.status, 404);
    assert.equal(calls.update, 1);
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
  const { repository } = createAssessmentRepository({
    update: async () => {
      throw new Error('boom');
    },
  });
  const { repository: companyRepository } = createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/assessments/${defaultAssessment.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Updated Assessment',
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
  const { calls, repository } = createAssessmentRepository({
    delete: async () => undefined,
  });
  const { repository: companyRepository } = createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/assessments/${defaultAssessment.id}`,
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
  const { calls, repository } = createAssessmentRepository({
    delete: async () => {
      throw new RepositoryNotFoundError();
    },
  });
  const { repository: companyRepository } = createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/assessments/${defaultAssessment.id}`,
      {
        method: 'DELETE',
      },
    );

    assert.equal(response.status, 404);
    assert.equal(calls.delete, 1);
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
    delete: async () => {
      throw new RepositoryConstraintError();
    },
  });
  const { repository: companyRepository } = createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/assessments/${defaultAssessment.id}`,
      {
        method: 'DELETE',
      },
    );

    assert.equal(response.status, 409);
    assert.equal(calls.delete, 1);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'ASSESSMENT_DELETE_CONFLICT',
        message: 'Assessment cannot be deleted while related reports exist',
        details: [],
      },
    });
  } finally {
    await server.close();
  }
}

{
  const { repository } = createAssessmentRepository({
    delete: async () => {
      throw new Error('boom');
    },
  });
  const { repository: companyRepository } = createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/assessments/${defaultAssessment.id}`,
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

console.log('assessments API route checks passed');

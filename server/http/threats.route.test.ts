import assert from 'node:assert/strict';
import { createServer } from 'node:http';

import type { Assessment } from '../../src/domain/assessment.js';
import type { Threat } from '../../src/domain/threat.js';
import { loadServerConfig } from '../config.js';
import {
  RepositoryConstraintError,
  RepositoryNotFoundError,
} from '../database/errors.js';
import type { AssessmentRepository } from '../database/repositories/assessment.repository.js';
import type { ThreatRepository } from '../database/repositories/threat.repository.js';
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

const defaultAssessment: Assessment = {
  id: 'asm_00000000-0000-0000-0000-000000000001',
  companyId: 'cmp_00000000-0000-0000-0000-000000000001',
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
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-11T09:00:00.000Z',
};

const defaultThreat: Threat = {
  id: 'thr_00000000-0000-0000-0000-000000000001',
  assessmentId: defaultAssessment.id,
  title: 'Missing Server-Side Authorization',
  description: 'The endpoint returns another customer order.',
  severity: 'critical',
  strideCategories: ['spoofing', 'tampering'],
  status: 'accepted-risk',
  affectedAsset: '/api/v1/orders/{id}',
  impact: 'Unauthorised access to customer order data',
  recommendation: 'Apply object-level authorization on every request.',
  observation: 'An authenticated user can access another customer order.',
  affectedComponent: 'Orders API',
  affectedEndpoint: '/api/v1/orders/{id}',
  risk: 'Sensitive order data is exposed.',
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-11T09:00:00.000Z',
};

type AssessmentRepositoryOverrides = Partial<{
  findById: (id: string) => Promise<Assessment | null>;
}>;

type ThreatRepositoryOverrides = Partial<{
  findById: (id: string) => Promise<Threat | null>;
  findByAssessmentId: (assessmentId: string) => Promise<Threat[]>;
  create: (input: Parameters<ThreatRepository['create']>[0]) => Promise<Threat>;
  update: (
    id: string,
    input: Parameters<ThreatRepository['update']>[1],
  ) => Promise<Threat>;
  delete: (id: string) => Promise<void>;
}>;

const createAssessmentRepository = (
  overrides: AssessmentRepositoryOverrides = {},
) => {
  const calls = {
    findById: 0,
  };

  const repository: AssessmentRepository = {
    async findAll() {
      return [defaultAssessment];
    },

    async findById(id) {
      calls.findById += 1;
      return overrides.findById?.(id) ?? defaultAssessment;
    },

    async findByCompanyId() {
      return [defaultAssessment];
    },

    async create(input) {
      return {
        ...defaultAssessment,
        ...input,
      };
    },

    async update(id, input) {
      return {
        ...defaultAssessment,
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

const createThreatRepository = (overrides: ThreatRepositoryOverrides = {}) => {
  const calls = {
    findById: 0,
    findByAssessmentId: 0,
    create: 0,
    update: 0,
    delete: 0,
    createArgs: undefined as
      | {
          input: Parameters<ThreatRepository['create']>[0];
        }
      | undefined,
    updateArgs: undefined as
      | {
          id: string;
          input: Parameters<ThreatRepository['update']>[1];
        }
      | undefined,
  };

  const repository: ThreatRepository = {
    async findById(id) {
      calls.findById += 1;
      return overrides.findById?.(id) ?? defaultThreat;
    },

    async findByAssessmentId(assessmentId) {
      calls.findByAssessmentId += 1;
      return overrides.findByAssessmentId?.(assessmentId) ?? [defaultThreat];
    },

    async create(input) {
      calls.create += 1;
      calls.createArgs = { input };
      return (
        (await overrides.create?.(input)) ?? {
          ...defaultThreat,
          ...input,
        }
      );
    },

    async update(id, input) {
      calls.update += 1;
      calls.updateArgs = { id, input };
      return (
        (await overrides.update?.(id, input)) ?? {
          ...defaultThreat,
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

const validCreateThreatBody = {
  assessmentId: defaultAssessment.id,
  title: 'Missing Server-Side Authorization',
  description: 'The endpoint returns another customer order.',
  severity: 'critical',
  strideCategories: ['spoofing', 'tampering'],
  status: 'accepted-risk',
  affectedAsset: '/api/v1/orders/{id}',
  impact: 'Unauthorised access to customer order data',
  recommendation: 'Apply object-level authorization on every request.',
  observation: 'An authenticated user can access another customer order.',
  affectedComponent: 'Orders API',
  affectedEndpoint: '/api/v1/orders/{id}',
  risk: 'Sensitive order data is exposed.',
};

const validUpdateThreatBody = {
  title: 'Missing server-side authorization',
  status: 'mitigated',
  risk: 'Risk reduced after remediation',
};

const createApp = (
  assessmentRepository: AssessmentRepository,
  threatRepository: ThreatRepository,
) =>
  createApiApp(config, {
    assessmentRepository,
    threatRepository,
  });

{
  const { calls: assessmentCalls, repository: assessmentRepository } =
    createAssessmentRepository();
  const { calls, repository } = createThreatRepository({
    findByAssessmentId: async () => [defaultThreat],
  });
  const server = await startTestServer(
    createApp(assessmentRepository, repository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/threats?assessmentId=${defaultAssessment.id}`,
    );

    assert.equal(response.status, 200);
    assert.deepEqual(
      await readJson<{ data: Array<typeof defaultThreat> }>(response),
      {
        data: [defaultThreat],
      },
    );
    assert.equal(assessmentCalls.findById, 1);
    assert.equal(calls.findByAssessmentId, 1);
  } finally {
    await server.close();
  }
}

{
  const { calls: assessmentCalls, repository: assessmentRepository } =
    createAssessmentRepository();
  const { calls, repository } = createThreatRepository();
  const server = await startTestServer(
    createApp(assessmentRepository, repository),
  );

  try {
    const response = await fetch(`${server.baseUrl}/api/threats`);

    assert.equal(response.status, 400);
    assert.equal(assessmentCalls.findById, 0);
    assert.equal(calls.findByAssessmentId, 0);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: [
          {
            path: 'assessmentId',
            message: 'Required',
            code: 'invalid_type',
          },
        ],
      },
    });
  } finally {
    await server.close();
  }
}

{
  const { calls: assessmentCalls, repository: assessmentRepository } =
    createAssessmentRepository();
  const { calls, repository } = createThreatRepository();
  const server = await startTestServer(
    createApp(assessmentRepository, repository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/threats?assessmentId=asm_not-prefixed`,
    );

    assert.equal(response.status, 400);
    assert.equal(assessmentCalls.findById, 0);
    assert.equal(calls.findByAssessmentId, 0);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: [
          {
            path: 'assessmentId',
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
  const { calls: assessmentCalls, repository: assessmentRepository } =
    createAssessmentRepository();
  const { calls, repository } = createThreatRepository();
  const server = await startTestServer(
    createApp(assessmentRepository, repository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/threats?assessmentId=${defaultAssessment.id}&unexpected=1`,
    );

    assert.equal(response.status, 400);
    assert.equal(assessmentCalls.findById, 0);
    assert.equal(calls.findByAssessmentId, 0);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: [
          {
            path: 'unexpected',
            message: 'Unknown property: unexpected',
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
  const { calls: assessmentCalls, repository: assessmentRepository } =
    createAssessmentRepository({
      findById: async () => null,
    });
  const { calls, repository } = createThreatRepository();
  const server = await startTestServer(
    createApp(assessmentRepository, repository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/threats?assessmentId=${defaultAssessment.id}`,
    );

    assert.equal(response.status, 404);
    assert.equal(assessmentCalls.findById, 1);
    assert.equal(calls.findByAssessmentId, 0);
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
  const { calls, repository } = createThreatRepository({
    findById: async () => defaultThreat,
  });
  const { repository: assessmentRepository } = createAssessmentRepository();
  const server = await startTestServer(
    createApp(assessmentRepository, repository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/threats/${defaultThreat.id}`,
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await readJson<{ data: typeof defaultThreat }>(response), {
      data: defaultThreat,
    });
    assert.equal(calls.findById, 1);
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createThreatRepository();
  const { repository: assessmentRepository } = createAssessmentRepository();
  const server = await startTestServer(
    createApp(assessmentRepository, repository),
  );

  try {
    const response = await fetch(`${server.baseUrl}/api/threats/not-an-id`);

    assert.equal(response.status, 400);
    assert.equal(calls.findById, 0);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: [
          {
            path: 'id',
            message: 'Threat ID must be a prefixed UUID',
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
  const { calls, repository } = createThreatRepository({
    findById: async () => null,
  });
  const { repository: assessmentRepository } = createAssessmentRepository();
  const server = await startTestServer(
    createApp(assessmentRepository, repository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/threats/${defaultThreat.id}`,
    );

    assert.equal(response.status, 404);
    assert.equal(calls.findById, 1);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'THREAT_NOT_FOUND',
        message: 'Threat not found',
        details: [],
      },
    });
  } finally {
    await server.close();
  }
}

{
  const { calls: assessmentCalls, repository: assessmentRepository } =
    createAssessmentRepository();
  const { calls, repository } = createThreatRepository({
    create: async () => defaultThreat,
  });
  const server = await startTestServer(
    createApp(assessmentRepository, repository),
  );

  try {
    const response = await fetch(`${server.baseUrl}/api/threats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validCreateThreatBody),
    });

    assert.equal(response.status, 201);
    assert.equal(
      response.headers.get('location'),
      `/api/threats/${defaultThreat.id}`,
    );
    const body = await readJson<{ data: typeof defaultThreat }>(response);
    assert.equal(body.data.id, defaultThreat.id);
    assert.equal(calls.create, 1);
    assert.equal(assessmentCalls.findById, 1);
    assert.equal(calls.createArgs?.input.assessmentId, defaultAssessment.id);
  } finally {
    await server.close();
  }
}

{
  const { calls: assessmentCalls, repository: assessmentRepository } =
    createAssessmentRepository({
      findById: async () => null,
    });
  const { calls, repository } = createThreatRepository();
  const server = await startTestServer(
    createApp(assessmentRepository, repository),
  );

  try {
    const response = await fetch(`${server.baseUrl}/api/threats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validCreateThreatBody),
    });

    assert.equal(response.status, 404);
    assert.equal(calls.create, 0);
    assert.equal(assessmentCalls.findById, 1);
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
  const { calls: assessmentCalls, repository: assessmentRepository } =
    createAssessmentRepository();
  const { calls, repository } = createThreatRepository({
    create: async () => {
      throw new RepositoryConstraintError();
    },
  });
  const server = await startTestServer(
    createApp(assessmentRepository, repository),
  );

  try {
    const response = await fetch(`${server.baseUrl}/api/threats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validCreateThreatBody),
    });

    assert.equal(response.status, 409);
    assert.equal(assessmentCalls.findById, 1);
    assert.equal(calls.create, 1);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'THREAT_CONFLICT',
        message: 'A threat with the same unique value already exists',
        details: [],
      },
    });
  } finally {
    await server.close();
  }
}

for (const [body, path, messageIncludes] of [
  [
    {
      ...validCreateThreatBody,
      severity: 'extreme',
    },
    'severity',
    'Invalid enum value',
  ],
  [
    {
      ...validCreateThreatBody,
      status: 'accepted',
    },
    'status',
    'Invalid enum value',
  ],
  [
    {
      ...validCreateThreatBody,
      strideCategories: ['privilege-escalation'],
    },
    'strideCategories',
    'Invalid enum value',
  ],
  [
    (() => {
      const { strideCategories: _strideCategories, ...body } =
        validCreateThreatBody;

      return {
        ...body,
        title: 'Missing required stride data',
      };
    })(),
    'strideCategories',
    'Required',
  ],
  [
    {
      ...validCreateThreatBody,
      id: 'thr_client_controlled',
    },
    'id',
    'Unknown property',
  ],
  [
    {
      ...validCreateThreatBody,
      createdAt: '2026-06-12T00:00:00.000Z',
    },
    'createdAt',
    'Unknown property',
  ],
  [
    {
      ...validCreateThreatBody,
      updatedAt: '2026-06-12T00:00:00.000Z',
    },
    'updatedAt',
    'Unknown property',
  ],
] as const) {
  const { calls: assessmentCalls, repository: assessmentRepository } =
    createAssessmentRepository();
  const { calls, repository } = createThreatRepository();
  const server = await startTestServer(
    createApp(assessmentRepository, repository),
  );

  try {
    const response = await fetch(`${server.baseUrl}/api/threats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    assert.equal(response.status, 400);
    assert.equal(calls.create, 0);
    assert.equal(assessmentCalls.findById, 0);
    const error = await readJson<ApiErrorBody>(response);
    assert.equal(error.error.code, 'VALIDATION_ERROR');
    assert.ok(
      error.error.details.some(
        detail =>
          detail.path === path && detail.message.includes(messageIncludes),
      ),
    );
  } finally {
    await server.close();
  }
}

{
  const { repository: assessmentRepository } = createAssessmentRepository();
  const { repository } = createThreatRepository({
    create: async () => {
      throw new Error('boom');
    },
  });
  const server = await startTestServer(
    createApp(assessmentRepository, repository),
  );

  try {
    const response = await fetch(`${server.baseUrl}/api/threats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validCreateThreatBody),
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
  const { calls, repository } = createThreatRepository({
    update: async (_id, input) => ({
      ...defaultThreat,
      ...input,
    }),
  });
  const { repository: assessmentRepository } = createAssessmentRepository();
  const server = await startTestServer(
    createApp(assessmentRepository, repository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/threats/${defaultThreat.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validUpdateThreatBody),
      },
    );

    assert.equal(response.status, 200);
    const body = await readJson<{ data: typeof defaultThreat }>(response);
    assert.equal(body.data.title, 'Missing server-side authorization');
    assert.equal(body.data.status, 'mitigated');
    assert.equal(calls.update, 1);
    assert.equal(calls.updateArgs?.id, defaultThreat.id);
    assert.equal(
      calls.updateArgs?.input.title,
      'Missing server-side authorization',
    );
  } finally {
    await server.close();
  }
}

for (const [body, path, messageIncludes] of [
  [{}, '', 'At least one threat field is required'],
  [{ id: 'thr_client_controlled' }, 'id', 'Unknown property'],
  [{ assessmentId: defaultAssessment.id }, 'assessmentId', 'Unknown property'],
  [{ createdAt: '2026-06-12T00:00:00.000Z' }, 'createdAt', 'Unknown property'],
  [{ updatedAt: '2026-06-12T00:00:00.000Z' }, 'updatedAt', 'Unknown property'],
] as const) {
  const { calls, repository } = createThreatRepository();
  const { repository: assessmentRepository } = createAssessmentRepository();
  const server = await startTestServer(
    createApp(assessmentRepository, repository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/threats/${defaultThreat.id}`,
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
    const error = await readJson<ApiErrorBody>(response);
    assert.equal(error.error.code, 'VALIDATION_ERROR');
    assert.ok(
      error.error.details.some(
        detail =>
          detail.path === path && detail.message.includes(messageIncludes),
      ),
    );
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createThreatRepository({
    update: async () => {
      throw new RepositoryNotFoundError();
    },
  });
  const { repository: assessmentRepository } = createAssessmentRepository();
  const server = await startTestServer(
    createApp(assessmentRepository, repository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/threats/${defaultThreat.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Updated title',
        }),
      },
    );

    assert.equal(response.status, 404);
    assert.equal(calls.update, 1);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'THREAT_NOT_FOUND',
        message: 'Threat not found',
        details: [],
      },
    });
  } finally {
    await server.close();
  }
}

{
  const { repository } = createThreatRepository({
    update: async () => {
      throw new Error('boom');
    },
  });
  const { repository: assessmentRepository } = createAssessmentRepository();
  const server = await startTestServer(
    createApp(assessmentRepository, repository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/threats/${defaultThreat.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Updated title',
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
  const { calls, repository } = createThreatRepository({
    delete: async () => undefined,
  });
  const { repository: assessmentRepository } = createAssessmentRepository();
  const server = await startTestServer(
    createApp(assessmentRepository, repository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/threats/${defaultThreat.id}`,
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
  const { calls, repository } = createThreatRepository({
    delete: async () => {
      throw new RepositoryNotFoundError();
    },
  });
  const { repository: assessmentRepository } = createAssessmentRepository();
  const server = await startTestServer(
    createApp(assessmentRepository, repository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/threats/${defaultThreat.id}`,
      {
        method: 'DELETE',
      },
    );

    assert.equal(response.status, 404);
    assert.equal(calls.delete, 1);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'THREAT_NOT_FOUND',
        message: 'Threat not found',
        details: [],
      },
    });
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createThreatRepository({
    delete: async () => {
      throw new RepositoryConstraintError();
    },
  });
  const { repository: assessmentRepository } = createAssessmentRepository();
  const server = await startTestServer(
    createApp(assessmentRepository, repository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/threats/${defaultThreat.id}`,
      {
        method: 'DELETE',
      },
    );

    assert.equal(response.status, 409);
    assert.equal(calls.delete, 1);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'THREAT_DELETE_CONFLICT',
        message:
          'Threat cannot be deleted while related evidence or reports exist',
        details: [],
      },
    });
  } finally {
    await server.close();
  }
}

{
  const { repository } = createThreatRepository({
    delete: async () => {
      throw new Error('boom');
    },
  });
  const { repository: assessmentRepository } = createAssessmentRepository();
  const server = await startTestServer(
    createApp(assessmentRepository, repository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/threats/${defaultThreat.id}`,
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

console.log('threats API route checks passed');

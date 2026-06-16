import assert from 'node:assert/strict';
import { createServer } from 'node:http';

import { loadServerConfig } from '../config.js';
import {
  RepositoryError,
  RepositoryNotFoundError,
} from '../database/errors.js';
import type { Assessment } from '../../src/domain/assessment.js';
import type { Evidence } from '../../src/domain/evidence.js';
import type { Threat } from '../../src/domain/threat.js';
import type { AssessmentRepository } from '../database/repositories/assessment.repository.js';
import type { EvidenceRepository } from '../database/repositories/evidence.repository.js';
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

const otherAssessment: Assessment = {
  ...defaultAssessment,
  id: 'asm_00000000-0000-0000-0000-000000000002',
  title: 'External assessment',
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

const otherThreat: Threat = {
  ...defaultThreat,
  id: 'thr_00000000-0000-0000-0000-000000000002',
  assessmentId: otherAssessment.id,
  title: 'Different assessment threat',
};

const defaultEvidence: Evidence = {
  id: 'evd_00000000-0000-0000-0000-000000000001',
  assessmentId: defaultAssessment.id,
  threatIds: [defaultThreat.id],
  type: 'screenshot',
  title: 'Evidence screenshot',
  description: 'Portal screenshot',
  content: 'Base64 payload',
  fileName: 'evidence.png',
  filePath: 'uploads/evidence/evidence.png',
  mimeType: 'image/png',
  capturedAt: '2026-06-05',
  createdAt: '2026-06-05T00:00:00.000Z',
  updatedAt: '2026-06-05T00:00:00.000Z',
};

type AssessmentRepositoryOverrides = Partial<{
  findById: (id: string) => Promise<Assessment | null>;
}>;

type ThreatRepositoryOverrides = Partial<{
  findById: (id: string) => Promise<Threat | null>;
}>;

type EvidenceRepositoryOverrides = Partial<{
  findById: (id: string) => Promise<Evidence | null>;
  findByAssessmentId: (assessmentId: string) => Promise<Array<Evidence>>;
  create: (
    input: Parameters<EvidenceRepository['create']>[0],
  ) => Promise<Evidence>;
  update: (
    id: string,
    input: Parameters<EvidenceRepository['update']>[1],
  ) => Promise<Evidence>;
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
  };

  const repository: ThreatRepository = {
    async findById(id) {
      calls.findById += 1;
      return overrides.findById?.(id) ?? defaultThreat;
    },

    async findByAssessmentId() {
      return [defaultThreat];
    },

    async create(input) {
      return {
        ...defaultThreat,
        ...input,
      };
    },

    async update(id, input) {
      return {
        ...defaultThreat,
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

const createEvidenceRepository = (
  overrides: EvidenceRepositoryOverrides = {},
) => {
  const calls = {
    findById: 0,
    findByAssessmentId: 0,
    create: 0,
    update: 0,
    delete: 0,
    createArgs: undefined as
      | {
          input: Parameters<EvidenceRepository['create']>[0];
        }
      | undefined,
    updateArgs: undefined as
      | {
          id: string;
          input: Parameters<EvidenceRepository['update']>[1];
        }
      | undefined,
  };

  const repository: EvidenceRepository = {
    async findById(id) {
      calls.findById += 1;
      return overrides.findById?.(id) ?? defaultEvidence;
    },

    async findByAssessmentId(assessmentId) {
      calls.findByAssessmentId += 1;
      return overrides.findByAssessmentId?.(assessmentId) ?? [defaultEvidence];
    },

    async create(input) {
      calls.create += 1;
      calls.createArgs = { input };
      const storageKey = input.fileName
        ? `uploads/evidence/mock/${input.fileName}`
        : defaultEvidence.filePath;
      return (
        (await overrides.create?.(input)) ?? {
          ...defaultEvidence,
          ...input,
          filePath: storageKey,
          storageKey,
          httpExchanges: input.httpExchanges ?? [],
        }
      );
    },

    async update(id, input) {
      calls.update += 1;
      calls.updateArgs = { id, input };
      const storageKey = input.fileName
        ? `uploads/evidence/mock/${input.fileName}`
        : defaultEvidence.filePath;
      return (
        (await overrides.update?.(id, input)) ?? {
          ...defaultEvidence,
          id,
          ...input,
          filePath: storageKey,
          storageKey,
          httpExchanges: input.httpExchanges ?? defaultEvidence.httpExchanges,
        }
      );
    },

    async delete(id) {
      calls.delete += 1;
      return overrides.delete?.(id);
    },

    async attachToThreat() {
      return undefined;
    },

    async detachFromThreat() {
      return undefined;
    },
  };

  return { calls, repository };
};

const createApp = (
  assessmentRepository: AssessmentRepository,
  threatRepository: ThreatRepository,
  evidenceRepository: EvidenceRepository,
) =>
  createApiApp(config, {
    assessmentRepository,
    threatRepository,
    evidenceRepository,
  });

{
  const { calls, repository } = createAssessmentRepository();
  const { repository: threatRepository } = createThreatRepository();
  const { calls: evidenceCalls, repository: evidenceRepository } =
    createEvidenceRepository({
      findByAssessmentId: async () => [defaultEvidence],
    });
  const server = await startTestServer(
    createApp(repository, threatRepository, evidenceRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/evidence?assessmentId=${defaultAssessment.id}`,
    );

    assert.equal(response.status, 200);
    assert.deepEqual(
      await readJson<{ data: Array<typeof defaultEvidence> }>(response),
      {
        data: [defaultEvidence],
      },
    );
    assert.equal(calls.findById, 1);
    assert.equal(evidenceCalls.findByAssessmentId, 1);
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createAssessmentRepository({
    findById: async () => null,
  });
  const { repository: threatRepository } = createThreatRepository();
  const { calls: evidenceCalls, repository: evidenceRepository } =
    createEvidenceRepository();
  const server = await startTestServer(
    createApp(repository, threatRepository, evidenceRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/evidence?assessmentId=${defaultAssessment.id}`,
    );

    assert.equal(response.status, 404);
    assert.equal(calls.findById, 1);
    assert.equal(evidenceCalls.findByAssessmentId, 0);
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
  const { repository: threatRepository } = createThreatRepository();
  const { calls: evidenceCalls, repository: evidenceRepository } =
    createEvidenceRepository({
      findById: async () => defaultEvidence,
    });
  const server = await startTestServer(
    createApp(repository, threatRepository, evidenceRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/evidence/${defaultEvidence.id}`,
    );

    assert.equal(response.status, 200);
    assert.deepEqual(
      await readJson<{ data: typeof defaultEvidence }>(response),
      {
        data: defaultEvidence,
      },
    );
    assert.equal(evidenceCalls.findById, 1);
    assert.equal(calls.findById, 0);
  } finally {
    await server.close();
  }
}

{
  const httpEvidence: Evidence = {
    ...defaultEvidence,
    type: 'http',
    httpExchanges: [
      {
        request: {
          method: 'GET',
          url: '/api/orders/1',
        },
        response: {
          statusCode: 200,
          body: 'ok',
        },
      },
    ],
  };
  const { repository } = createAssessmentRepository();
  const { repository: threatRepository } = createThreatRepository();
  const { calls: evidenceCalls, repository: evidenceRepository } =
    createEvidenceRepository({
      findById: async () => httpEvidence,
    });
  const server = await startTestServer(
    createApp(repository, threatRepository, evidenceRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/evidence/${defaultEvidence.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'http',
          httpExchanges: [],
        }),
      },
    );

    assert.equal(response.status, 400);
    assert.equal(evidenceCalls.update, 0);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(
      body.error.details.some(
        detail =>
          detail.path === 'httpExchanges' &&
          detail.message.includes('at least one exchange'),
      ),
    );
  } finally {
    await server.close();
  }
}

{
  const httpEvidence: Evidence = {
    ...defaultEvidence,
    type: 'http',
    httpExchanges: [
      {
        request: {
          method: 'GET',
          url: '/api/orders/1',
        },
        response: {
          statusCode: 200,
          body: 'ok',
        },
      },
    ],
  };
  const { repository } = createAssessmentRepository();
  const { repository: threatRepository } = createThreatRepository();
  const { calls: evidenceCalls, repository: evidenceRepository } =
    createEvidenceRepository({
      findById: async () => httpEvidence,
    });
  const server = await startTestServer(
    createApp(repository, threatRepository, evidenceRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/evidence/${defaultEvidence.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'text',
        }),
      },
    );

    assert.equal(response.status, 400);
    assert.equal(evidenceCalls.update, 0);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(
      body.error.details.some(
        detail =>
          detail.path === 'httpExchanges' &&
          detail.message.includes('cleared when changing evidence'),
      ),
    );
  } finally {
    await server.close();
  }
}

{
  const httpEvidence: Evidence = {
    ...defaultEvidence,
    type: 'http',
    httpExchanges: [
      {
        request: {
          method: 'GET',
          url: '/api/orders/1',
        },
        response: {
          statusCode: 200,
          body: 'ok',
        },
      },
    ],
  };
  const { repository } = createAssessmentRepository();
  const { repository: threatRepository } = createThreatRepository();
  const { calls: evidenceCalls, repository: evidenceRepository } =
    createEvidenceRepository({
      findById: async () => httpEvidence,
      update: async (_id, input) => ({
        ...httpEvidence,
        ...input,
        httpExchanges: input.httpExchanges ?? httpEvidence.httpExchanges,
      }),
    });
  const server = await startTestServer(
    createApp(repository, threatRepository, evidenceRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/evidence/${defaultEvidence.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'text',
          httpExchanges: [],
        }),
      },
    );

    assert.equal(response.status, 200);
    const body = await readJson<{ data: Evidence }>(response);
    assert.equal(body.data.type, 'text');
    assert.deepEqual(body.data.httpExchanges, []);
    assert.equal(evidenceCalls.update, 1);
    assert.deepEqual(evidenceCalls.updateArgs?.input.httpExchanges, []);
  } finally {
    await server.close();
  }
}

{
  const { repository } = createAssessmentRepository();
  const { repository: threatRepository } = createThreatRepository();
  const { calls: evidenceCalls, repository: evidenceRepository } =
    createEvidenceRepository({
      findById: async () => defaultEvidence,
    });
  const server = await startTestServer(
    createApp(repository, threatRepository, evidenceRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/evidence/${defaultEvidence.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mimeType: 'application/pdf',
        }),
      },
    );

    assert.equal(response.status, 400);
    assert.equal(evidenceCalls.update, 0);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(
      body.error.details.some(
        detail =>
          detail.path === 'fileName' &&
          detail.message.includes(
            'Evidence file name extension must match the supplied mime type',
          ),
      ),
    );
  } finally {
    await server.close();
  }
}

{
  const { repository } = createAssessmentRepository();
  const { repository: threatRepository } = createThreatRepository();
  const { calls: evidenceCalls, repository: evidenceRepository } =
    createEvidenceRepository({
      findById: async () => defaultEvidence,
    });
  const server = await startTestServer(
    createApp(repository, threatRepository, evidenceRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/evidence/${defaultEvidence.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: 'evidence.pdf',
        }),
      },
    );

    assert.equal(response.status, 400);
    assert.equal(evidenceCalls.update, 0);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(
      body.error.details.some(
        detail =>
          detail.path === 'fileName' &&
          detail.message.includes(
            'Evidence file name extension must match the supplied mime type',
          ),
      ),
    );
  } finally {
    await server.close();
  }
}

{
  const { repository } = createAssessmentRepository();
  const { repository: threatRepository } = createThreatRepository();
  const { calls: evidenceCalls, repository: evidenceRepository } =
    createEvidenceRepository({
      findById: async () => null,
    });
  const server = await startTestServer(
    createApp(repository, threatRepository, evidenceRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/evidence/${defaultEvidence.id}`,
    );

    assert.equal(response.status, 404);
    assert.equal(evidenceCalls.findById, 1);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'EVIDENCE_NOT_FOUND',
        message: 'Evidence not found',
        details: [],
      },
    });
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createAssessmentRepository();
  const { calls: threatCalls, repository: threatRepository } =
    createThreatRepository({
      findById: async id =>
        id === defaultThreat.id ? defaultThreat : otherThreat,
    });
  const { calls: evidenceCalls, repository: evidenceRepository } =
    createEvidenceRepository({
      create: async input => ({
        ...defaultEvidence,
        ...input,
        threatIds: input.threatIds,
      }),
    });
  const server = await startTestServer(
    createApp(repository, threatRepository, evidenceRepository),
  );

  try {
    const response = await fetch(`${server.baseUrl}/api/evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assessmentId: defaultAssessment.id,
        threatIds: [defaultThreat.id, defaultThreat.id],
        type: 'screenshot',
        title: 'Evidence screenshot',
        description: 'Portal screenshot',
        content: 'Base64 payload',
        fileName: 'evidence.png',
        mimeType: 'image/png',
        capturedAt: '2026-06-05',
      }),
    });

    assert.equal(response.status, 201);
    assert.ok(
      response.headers.get('location')?.startsWith('/api/evidence/evd_'),
    );
    const body = await readJson<{ data: typeof defaultEvidence }>(response);
    assert.equal(body.data.assessmentId, defaultAssessment.id);
    assert.equal(body.data.filePath, 'uploads/evidence/mock/evidence.png');
    assert.equal(calls.findById, 1);
    assert.equal(threatCalls.findById, 2);
    assert.equal(evidenceCalls.create, 1);
    assert.equal(
      evidenceCalls.createArgs?.input.assessmentId,
      defaultAssessment.id,
    );
    assert.equal(evidenceCalls.createArgs?.input.filePath, undefined);
    assert.equal(evidenceCalls.createArgs?.input.storageKey, undefined);
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createAssessmentRepository();
  const { calls: threatCalls, repository: threatRepository } =
    createThreatRepository();
  const { calls: evidenceCalls, repository: evidenceRepository } =
    createEvidenceRepository();
  const server = await startTestServer(
    createApp(repository, threatRepository, evidenceRepository),
  );

  try {
    const response = await fetch(`${server.baseUrl}/api/evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assessmentId: defaultAssessment.id,
        threatIds: [defaultThreat.id],
        type: 'note',
        title: 'Evidence note',
        fileName: 'evidence.txt',
        mimeType: 'image/png',
      }),
    });

    assert.equal(response.status, 400);
    assert.equal(calls.findById, 0);
    assert.equal(threatCalls.findById, 0);
    assert.equal(evidenceCalls.create, 0);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(
      body.error.details.some(
        detail =>
          detail.path === 'fileName' &&
          detail.message.includes(
            'Evidence file name extension must match the supplied mime type',
          ),
      ),
    );
  } finally {
    await server.close();
  }
}

{
  const { repository } = createAssessmentRepository();
  const { repository: threatRepository } = createThreatRepository();
  const { calls: evidenceCalls, repository: evidenceRepository } =
    createEvidenceRepository({
      create: async input => ({
        ...defaultEvidence,
        ...input,
        httpExchanges: input.httpExchanges ?? [],
      }),
    });
  const server = await startTestServer(
    createApp(repository, threatRepository, evidenceRepository),
  );

  try {
    const response = await fetch(`${server.baseUrl}/api/evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assessmentId: defaultAssessment.id,
        type: 'http',
        title: 'HTTP evidence',
        httpExchanges: [
          {
            request: {
              method: 'GET',
              url: '/api/orders/1',
            },
            response: {
              statusCode: 200,
              body: 'ok',
            },
          },
          {
            request: {
              method: 'POST',
              url: '/api/orders/1',
              body: 'body',
            },
            response: {
              statusCode: 201,
              body: 'created',
            },
          },
        ],
      }),
    });

    assert.equal(response.status, 201);
    const body = await readJson<{ data: Evidence }>(response);
    assert.equal(body.data.type, 'http');
    assert.equal(body.data.httpExchanges?.length, 2);
    assert.equal(body.data.httpExchanges?.[0]?.request.method, 'GET');
    assert.equal(body.data.httpExchanges?.[1]?.response.statusCode, 201);
    assert.equal(evidenceCalls.create, 1);
    assert.equal(evidenceCalls.createArgs?.input.httpExchanges?.length, 2);
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createAssessmentRepository();
  const { repository: threatRepository } = createThreatRepository();
  const { calls: evidenceCalls, repository: evidenceRepository } =
    createEvidenceRepository();
  const server = await startTestServer(
    createApp(repository, threatRepository, evidenceRepository),
  );

  try {
    const response = await fetch(`${server.baseUrl}/api/evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assessmentId: defaultAssessment.id,
        type: 'text',
        title: 'Notes',
        httpExchanges: [
          {
            request: {
              method: 'GET',
              url: '/api/orders/1',
            },
            response: {
              statusCode: 200,
            },
          },
        ],
      }),
    });

    assert.equal(response.status, 400);
    assert.equal(calls.findById, 0);
    assert.equal(evidenceCalls.create, 0);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(
      body.error.details.some(
        detail =>
          detail.path === 'httpExchanges' &&
          detail.message.includes('Only HTTP evidence can include exchanges'),
      ),
    );
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createAssessmentRepository();
  const { calls: threatCalls, repository: threatRepository } =
    createThreatRepository({
      findById: async () => otherThreat,
    });
  const { calls: evidenceCalls, repository: evidenceRepository } =
    createEvidenceRepository();
  const server = await startTestServer(
    createApp(repository, threatRepository, evidenceRepository),
  );

  try {
    const response = await fetch(`${server.baseUrl}/api/evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assessmentId: defaultAssessment.id,
        threatIds: [otherThreat.id],
        type: 'note',
        title: 'Evidence note',
      }),
    });

    assert.equal(response.status, 400);
    assert.equal(calls.findById, 1);
    assert.equal(threatCalls.findById, 1);
    assert.equal(evidenceCalls.create, 0);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(
      body.error.details.some(
        detail =>
          detail.path === 'threatIds.0' &&
          detail.message.includes(
            'Threat must belong to the selected assessment',
          ),
      ),
    );
  } finally {
    await server.close();
  }
}

{
  const { repository } = createAssessmentRepository({
    findById: async () => null,
  });
  const { repository: threatRepository } = createThreatRepository();
  const { calls: evidenceCalls, repository: evidenceRepository } =
    createEvidenceRepository();
  const server = await startTestServer(
    createApp(repository, threatRepository, evidenceRepository),
  );

  try {
    const response = await fetch(`${server.baseUrl}/api/evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assessmentId: defaultAssessment.id,
        threatIds: [defaultThreat.id],
        type: 'note',
        title: 'Evidence note',
      }),
    });

    assert.equal(response.status, 404);
    assert.equal(evidenceCalls.create, 0);
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
  const { repository: threatRepository } = createThreatRepository();
  const { calls: evidenceCalls, repository: evidenceRepository } =
    createEvidenceRepository({
      update: async (_id, input) => ({
        ...defaultEvidence,
        ...input,
        filePath: input.filePath ?? defaultEvidence.filePath,
      }),
    });
  const server = await startTestServer(
    createApp(repository, threatRepository, evidenceRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/evidence/${defaultEvidence.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Updated evidence title',
          fileName: 'updated-evidence.png',
        }),
      },
    );

    assert.equal(response.status, 200);
    const body = await readJson<{ data: typeof defaultEvidence }>(response);
    assert.equal(body.data.title, 'Updated evidence title');
    assert.equal(
      body.data.filePath,
      'uploads/evidence/mock/updated-evidence.png',
    );
    assert.equal(evidenceCalls.findById, 1);
    assert.equal(calls.findById, 1);
    assert.equal(evidenceCalls.update, 1);
    assert.equal(evidenceCalls.updateArgs?.id, defaultEvidence.id);
    assert.equal(evidenceCalls.updateArgs?.input.assessmentId, undefined);
    assert.equal(evidenceCalls.updateArgs?.input.filePath, undefined);
    assert.equal(evidenceCalls.updateArgs?.input.storageKey, undefined);
  } finally {
    await server.close();
  }
}

{
  const { repository } = createAssessmentRepository();
  const { repository: threatRepository } = createThreatRepository();
  const { calls: evidenceCalls, repository: evidenceRepository } =
    createEvidenceRepository();
  const server = await startTestServer(
    createApp(repository, threatRepository, evidenceRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/evidence/${defaultEvidence.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentId: defaultAssessment.id,
        }),
      },
    );

    assert.equal(response.status, 400);
    assert.equal(evidenceCalls.update, 0);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(
      body.error.details.some(
        detail =>
          detail.path === 'assessmentId' &&
          detail.message.includes('Unknown property'),
      ),
    );
  } finally {
    await server.close();
  }
}

{
  const { repository } = createAssessmentRepository();
  const { calls: threatCalls, repository: threatRepository } =
    createThreatRepository({
      findById: async () => otherThreat,
    });
  const { calls: evidenceCalls, repository: evidenceRepository } =
    createEvidenceRepository();
  const server = await startTestServer(
    createApp(repository, threatRepository, evidenceRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/evidence/${defaultEvidence.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threatIds: [otherThreat.id],
        }),
      },
    );

    assert.equal(response.status, 400);
    assert.equal(threatCalls.findById, 1);
    assert.equal(evidenceCalls.update, 0);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(
      body.error.details.some(
        detail =>
          detail.path === 'threatIds.0' &&
          detail.message.includes(
            'Threat must belong to the selected assessment',
          ),
      ),
    );
  } finally {
    await server.close();
  }
}

{
  const { repository } = createAssessmentRepository();
  const { repository: threatRepository } = createThreatRepository();
  const { calls: evidenceCalls, repository: evidenceRepository } =
    createEvidenceRepository({
      delete: async () => undefined,
    });
  const server = await startTestServer(
    createApp(repository, threatRepository, evidenceRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/evidence/${defaultEvidence.id}`,
      {
        method: 'DELETE',
      },
    );

    assert.equal(response.status, 204);
    assert.equal(await response.text(), '');
    assert.equal(evidenceCalls.delete, 1);
  } finally {
    await server.close();
  }
}

{
  const { repository } = createAssessmentRepository();
  const { repository: threatRepository } = createThreatRepository();
  const { calls: evidenceCalls, repository: evidenceRepository } =
    createEvidenceRepository({
      delete: async () => {
        throw new RepositoryNotFoundError();
      },
    });
  const server = await startTestServer(
    createApp(repository, threatRepository, evidenceRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/evidence/${defaultEvidence.id}`,
      {
        method: 'DELETE',
      },
    );

    assert.equal(response.status, 404);
    assert.equal(evidenceCalls.delete, 1);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'EVIDENCE_NOT_FOUND',
        message: 'Evidence not found',
        details: [],
      },
    });
  } finally {
    await server.close();
  }
}

{
  const { repository } = createAssessmentRepository();
  const { repository: threatRepository } = createThreatRepository();
  const { repository: evidenceRepository } = createEvidenceRepository({
    findById: async () => {
      throw new RepositoryError('boom');
    },
  });
  const server = await startTestServer(
    createApp(repository, threatRepository, evidenceRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/evidence/${defaultEvidence.id}`,
    );

    assert.equal(response.status, 500);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'INTERNAL_SERVER_ERROR');
    assert.equal(JSON.stringify(body).includes('boom'), false);
  } finally {
    await server.close();
  }
}

console.log('evidence API route checks passed');

import assert from 'node:assert/strict';

import { RepositoryConstraintError } from '../../database/errors.js';
import {
  createApp,
  createAssessmentRepository,
  createThreatRepository,
  defaultAssessment,
  defaultThreat,
  readJson,
  startTestServer,
  validCreateThreatBody,
  type ApiErrorBody,
} from './support.js';

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
    'strideCategories.0',
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

import assert from 'node:assert/strict';

import { RepositoryNotFoundError } from '../../database/errors.js';
import {
  createApp,
  createAssessmentRepository,
  createThreatRepository,
  defaultAssessment,
  defaultThreat,
  readJson,
  startTestServer,
  validUpdateThreatBody,
  type ApiErrorBody,
} from './support.js';

{
  const { calls: assessmentCalls, repository: assessmentRepository } =
    createAssessmentRepository();
  const { calls, repository } = createThreatRepository({
    update: async (_id, input) => ({
      ...defaultThreat,
      ...input,
    }),
  });
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
    assert.equal(assessmentCalls.findById, 1);
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

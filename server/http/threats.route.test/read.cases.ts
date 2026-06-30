import assert from 'node:assert/strict';

import {
  createApp,
  createAssessmentRepository,
  createThreatRepository,
  defaultThreat,
  readJson,
  startTestServer,
} from './support.js';

{
  const { calls: assessmentCalls, repository: assessmentRepository } =
    createAssessmentRepository();
  const { calls, repository } = createThreatRepository({
    findById: async () => defaultThreat,
  });
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
    assert.equal(assessmentCalls.findById, 1);
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

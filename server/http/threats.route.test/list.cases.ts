import assert from 'node:assert/strict';

import {
  createApp,
  createAssessmentRepository,
  createThreatRepository,
  defaultAssessment,
  defaultThreat,
  readJson,
  startTestServer,
} from './support.js';

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

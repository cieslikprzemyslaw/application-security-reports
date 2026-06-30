import assert from 'node:assert/strict';

import {
  RepositoryConstraintError,
  RepositoryNotFoundError,
} from '../../database/errors.js';
import {
  createApp,
  createAssessmentRepository,
  createThreatRepository,
  defaultThreat,
  readJson,
  startTestServer,
  type ApiErrorBody,
} from './support.js';

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

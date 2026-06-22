import assert from 'node:assert/strict';

import {
  createAssessmentRepository,
  createApp,
  createEvidenceRepository,
  createThreatRepository,
  defaultAssessment,
  defaultEvidence,
  readJson,
  startTestServer,
  type ApiErrorBody,
} from './support.js';

export const runEvidenceRouteReadListCases = async () => {
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
    const httpEvidence: typeof defaultEvidence = {
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
};

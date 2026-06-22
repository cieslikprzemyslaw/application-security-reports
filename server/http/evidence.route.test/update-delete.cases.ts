import assert from 'node:assert/strict';

import {
  RepositoryError,
  RepositoryNotFoundError,
} from '../../database/errors.js';
import {
  createAssessmentRepository,
  createApp,
  createEvidenceRepository,
  createThreatRepository,
  defaultAssessment,
  defaultEvidence,
  otherThreat,
  readJson,
  startTestServer,
  type ApiErrorBody,
} from './support.js';

export const runEvidenceRouteUpdateDeleteCases = async () => {
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
      assert.equal(body.data.filePath, 'uploads/evidence/evidence.png');
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
    const { repository: threatRepository } = createThreatRepository({
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
      createThreatRepository();
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

      assert.equal(response.status, 200);
      assert.equal(threatCalls.findById, 1);
      assert.equal(evidenceCalls.update, 1);
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
    const { repository } = createAssessmentRepository({
      findById: async () => null,
    });
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
};

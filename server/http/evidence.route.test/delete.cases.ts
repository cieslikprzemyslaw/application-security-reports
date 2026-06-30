import assert from 'node:assert/strict';

import { RepositoryNotFoundError } from '../../database/errors.js';
import {
  createApp,
  createAssessmentRepository,
  createEvidenceRepository,
  createThreatRepository,
  defaultEvidence,
  readJson,
  startTestServer,
} from './support.js';

export const runEvidenceRouteDeleteCases = async () => {
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
};

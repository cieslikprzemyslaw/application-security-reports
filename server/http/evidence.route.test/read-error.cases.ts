import assert from 'node:assert/strict';

import { RepositoryError } from '../../database/errors.js';
import {
  createApp,
  createAssessmentRepository,
  createEvidenceRepository,
  createThreatRepository,
  defaultEvidence,
  readJson,
  startTestServer,
  type ApiErrorBody,
} from './support.js';

export const runEvidenceRouteReadErrorCases = async () => {
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

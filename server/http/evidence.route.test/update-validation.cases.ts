import assert from 'node:assert/strict';

import type { Evidence } from '../../../src/domain/evidence.js';
import {
  createAssessmentRepository,
  createApp,
  createEvidenceRepository,
  createThreatRepository,
  defaultEvidence,
  readJson,
  startTestServer,
  type ApiErrorBody,
} from './support.js';

export const runEvidenceRouteUpdateValidationCases = async () => {
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
};

import assert from 'node:assert/strict';

import type { Evidence } from '../../../src/domain/evidence.js';
import {
  createAssessmentRepository,
  createApp,
  createEvidenceRepository,
  createThreatRepository,
  defaultAssessment,
  defaultEvidence,
  defaultThreat,
  otherThreat,
  readJson,
  startTestServer,
  type ApiErrorBody,
} from './support.js';

export const runEvidenceRouteCreateValidationCases = async () => {
  {
    const { calls, repository } = createAssessmentRepository();
    const { calls: threatCalls, repository: threatRepository } =
      createThreatRepository({
        findById: async id =>
          id === defaultThreat.id ? defaultThreat : otherThreat,
      });
    const { calls: evidenceCalls, repository: evidenceRepository } =
      createEvidenceRepository({
        create: async input => ({
          ...defaultEvidence,
          ...input,
          threatIds: input.threatIds,
        }),
      });
    const server = await startTestServer(
      createApp(repository, threatRepository, evidenceRepository),
    );

    try {
      const response = await fetch(`${server.baseUrl}/api/evidence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentId: defaultAssessment.id,
          threatIds: [defaultThreat.id, defaultThreat.id],
          type: 'screenshot',
          title: 'Evidence screenshot',
          description: 'Portal screenshot',
          content: 'Base64 payload',
          fileName: 'evidence.png',
          mimeType: 'image/png',
          capturedAt: '2026-06-05',
        }),
      });

      assert.equal(response.status, 201);
      assert.ok(
        response.headers.get('location')?.startsWith('/api/evidence/evd_'),
      );
      const body = await readJson<{ data: typeof defaultEvidence }>(response);
      assert.equal(body.data.assessmentId, defaultAssessment.id);
      assert.equal(body.data.filePath, 'uploads/evidence/evidence.png');
      assert.equal(calls.findById, 1);
      assert.equal(threatCalls.findById, 2);
      assert.equal(evidenceCalls.create, 1);
      assert.equal(
        evidenceCalls.createArgs?.input.assessmentId,
        defaultAssessment.id,
      );
      assert.equal(evidenceCalls.createArgs?.input.filePath, undefined);
      assert.equal(evidenceCalls.createArgs?.input.storageKey, undefined);
    } finally {
      await server.close();
    }
  }

  {
    const { calls, repository } = createAssessmentRepository();
    const { repository: threatRepository } = createThreatRepository();
    const { calls: evidenceCalls, repository: evidenceRepository } =
      createEvidenceRepository();
    const server = await startTestServer(
      createApp(repository, threatRepository, evidenceRepository),
    );

    try {
      const response = await fetch(`${server.baseUrl}/api/evidence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentId: defaultAssessment.id,
          threatIds: [defaultThreat.id],
          type: 'note',
          title: 'Evidence note',
          fileName: 'evidence.txt',
          mimeType: 'image/png',
        }),
      });

      assert.equal(response.status, 400);
      assert.equal(calls.findById, 0);
      assert.equal(evidenceCalls.create, 0);
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
        create: async input => ({
          ...defaultEvidence,
          ...input,
          httpExchanges: input.httpExchanges ?? [],
        }),
      });
    const server = await startTestServer(
      createApp(repository, threatRepository, evidenceRepository),
    );

    try {
      const response = await fetch(`${server.baseUrl}/api/evidence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentId: defaultAssessment.id,
          threatIds: [],
          type: 'http',
          title: 'HTTP evidence',
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
            {
              request: {
                method: 'POST',
                url: '/api/orders/1',
                body: 'body',
              },
              response: {
                statusCode: 201,
                body: 'created',
              },
            },
          ],
        }),
      });

      assert.equal(response.status, 201);
      const body = await readJson<{ data: Evidence }>(response);
      assert.equal(body.data.type, 'http');
      assert.equal(body.data.httpExchanges?.length, 2);
      assert.equal(body.data.httpExchanges?.[0]?.request.method, 'GET');
      assert.equal(body.data.httpExchanges?.[1]?.response.statusCode, 201);
      assert.equal(evidenceCalls.create, 1);
      assert.equal(evidenceCalls.createArgs?.input.httpExchanges?.length, 2);
    } finally {
      await server.close();
    }
  }

  {
    const { calls, repository } = createAssessmentRepository();
    const { repository: threatRepository } = createThreatRepository();
    const { calls: evidenceCalls, repository: evidenceRepository } =
      createEvidenceRepository();
    const server = await startTestServer(
      createApp(repository, threatRepository, evidenceRepository),
    );

    try {
      const response = await fetch(`${server.baseUrl}/api/evidence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentId: defaultAssessment.id,
          threatIds: [],
          type: 'text',
          title: 'Notes',
          httpExchanges: [
            {
              request: {
                method: 'GET',
                url: '/api/orders/1',
              },
              response: {
                statusCode: 200,
              },
            },
          ],
        }),
      });

      assert.equal(response.status, 400);
      assert.equal(calls.findById, 0);
      assert.equal(evidenceCalls.create, 0);
      const body = await readJson<ApiErrorBody>(response);
      assert.equal(body.error.code, 'VALIDATION_ERROR');
      assert.ok(
        body.error.details.some(
          detail =>
            detail.path === 'httpExchanges' &&
            detail.message.includes('Only HTTP evidence can include exchanges'),
        ),
      );
    } finally {
      await server.close();
    }
  }

  {
    const { calls, repository } = createAssessmentRepository();
    const { calls: threatCalls, repository: threatRepository } =
      createThreatRepository({
        findById: async () => otherThreat,
      });
    const { calls: evidenceCalls, repository: evidenceRepository } =
      createEvidenceRepository();
    const server = await startTestServer(
      createApp(repository, threatRepository, evidenceRepository),
    );

    try {
      const response = await fetch(`${server.baseUrl}/api/evidence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentId: defaultAssessment.id,
          threatIds: [otherThreat.id],
          type: 'note',
          title: 'Evidence note',
        }),
      });

      assert.equal(response.status, 400);
      assert.equal(calls.findById, 1);
      assert.equal(threatCalls.findById, 1);
      assert.equal(evidenceCalls.create, 0);
      const body = await readJson<ApiErrorBody>(response);
      assert.equal(body.error.code, 'VALIDATION_ERROR');
      assert.ok(
        body.error.details.some(
          detail =>
            detail.path === 'threatIds.0' &&
            detail.message.includes(
              'Threat must belong to the selected assessment',
            ),
        ),
      );
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
      createEvidenceRepository();
    const server = await startTestServer(
      createApp(repository, threatRepository, evidenceRepository),
    );

    try {
      const response = await fetch(`${server.baseUrl}/api/evidence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentId: defaultAssessment.id,
          threatIds: [defaultThreat.id],
          type: 'note',
          title: 'Evidence note',
        }),
      });

      assert.equal(response.status, 404);
      assert.equal(evidenceCalls.create, 0);
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
};

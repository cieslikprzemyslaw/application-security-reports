import assert from 'node:assert/strict';

import type { EvidenceRouteIntegrationHarness } from './support.js';

export const runEvidenceRouteIntegrationCases = async ({
  assessment,
  primaryThreat,
  secondaryThreat,
  prisma,
  server,
}: EvidenceRouteIntegrationHarness) => {
  const createResponse = await fetch(`${server.baseUrl}/api/evidence`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      assessmentId: assessment.id,
      threatIds: [primaryThreat.id, secondaryThreat.id],
      type: 'screenshot',
      title: 'Evidence screenshot',
      description: 'Portal screenshot',
      content: 'Base64 payload',
      fileName: 'evidence.png',
      mimeType: 'image/png',
      capturedAt: '2026-06-05',
    }),
  });

  assert.equal(createResponse.status, 201);
  const createdJson = (await createResponse.json()) as {
    data: {
      id: string;
      assessmentId: string;
      threatIds: string[];
      filePath?: string;
      storageKey?: string;
    };
  };
  assert.equal(createdJson.data.id.startsWith('evd_'), true);
  assert.equal(createdJson.data.assessmentId, assessment.id);
  assert.deepEqual(
    createdJson.data.threatIds.sort(),
    [primaryThreat.id, secondaryThreat.id].sort(),
  );
  assert.equal(
    createdJson.data.filePath?.startsWith(
      `uploads/evidence/${createdJson.data.id}/`,
    ),
    true,
  );
  assert.equal(createdJson.data.storageKey, createdJson.data.filePath);

  const evidenceId = createdJson.data.id;

  const listResponse = await fetch(
    `${server.baseUrl}/api/evidence?assessmentId=${assessment.id}`,
  );
  assert.equal(listResponse.status, 200);
  const listJson = (await listResponse.json()) as {
    data: Array<{ id: string }>;
  };
  assert.equal(listJson.data.length, 1);
  assert.equal(listJson.data[0]?.id, evidenceId);

  const getResponse = await fetch(
    `${server.baseUrl}/api/evidence/${evidenceId}`,
  );
  assert.equal(getResponse.status, 200);
  const getJson = (await getResponse.json()) as {
    data: { id: string; filePath?: string; storageKey?: string };
  };
  assert.equal(getJson.data.id, evidenceId);
  assert.equal(
    getJson.data.filePath?.startsWith(`uploads/evidence/${evidenceId}/`),
    true,
  );
  assert.equal(getJson.data.storageKey, getJson.data.filePath);

  const patchResponse = await fetch(
    `${server.baseUrl}/api/evidence/${evidenceId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Updated evidence title',
        threatIds: [secondaryThreat.id],
        fileName: 'updated-evidence.png',
      }),
    },
  );
  assert.equal(patchResponse.status, 200);
  const patchJson = (await patchResponse.json()) as {
    data: {
      id: string;
      title: string;
      threatIds: string[];
      filePath?: string;
      storageKey?: string;
    };
  };
  assert.equal(patchJson.data.id, evidenceId);
  assert.equal(patchJson.data.title, 'Updated evidence title');
  assert.deepEqual(patchJson.data.threatIds, [secondaryThreat.id]);
  assert.equal(
    patchJson.data.filePath?.startsWith(`uploads/evidence/${evidenceId}/`),
    true,
  );
  assert.equal(patchJson.data.storageKey, patchJson.data.filePath);

  const storedEvidence = await prisma.evidence.findUnique({
    where: { id: evidenceId },
    select: {
      threatLinks: {
        select: { threatId: true },
        orderBy: { threatId: 'asc' },
      },
    },
  });
  assert.deepEqual(
    storedEvidence?.threatLinks.map(
      (link: { threatId: string }) => link.threatId,
    ),
    [secondaryThreat.id],
  );

  const httpEvidenceResponse = await fetch(`${server.baseUrl}/api/evidence`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      assessmentId: assessment.id,
      threatIds: [],
      type: 'http',
      title: 'HTTP exchange evidence',
      httpExchanges: [
        {
          request: {
            method: 'GET',
            url: '/api/v1/orders/1',
          },
          response: {
            statusCode: 200,
            body: '{"ok":true}',
          },
        },
        {
          request: {
            method: 'POST',
            url: '/api/v1/orders/1',
            body: '{"confirm":true}',
          },
          response: {
            statusCode: 201,
            body: '{"created":true}',
          },
        },
      ],
    }),
  });

  assert.equal(httpEvidenceResponse.status, 201);
  const httpEvidenceJson = (await httpEvidenceResponse.json()) as {
    data: {
      id: string;
      httpExchanges: Array<{
        request: { method: string; url: string; body?: string };
        response: { statusCode: number; body?: string };
      }>;
    };
  };
  assert.equal(httpEvidenceJson.data.id.startsWith('evd_'), true);
  assert.equal(httpEvidenceJson.data.httpExchanges.length, 2);
  assert.equal(httpEvidenceJson.data.httpExchanges[0]?.request.method, 'GET');
  assert.equal(
    httpEvidenceJson.data.httpExchanges[1]?.response.statusCode,
    201,
  );

  const storedHttpEvidence = await prisma.evidence.findUnique({
    where: { id: httpEvidenceJson.data.id },
    include: {
      httpExchanges: {
        orderBy: { position: 'asc' },
        select: {
          position: true,
          request: true,
          response: true,
        },
      },
    },
  });
  assert.deepEqual(
    storedHttpEvidence?.httpExchanges.map(
      (exchange: {
        request: { method: string };
        response: { statusCode: number };
      }) => exchange.request.method,
    ),
    ['GET', 'POST'],
  );

  const invalidClearResponse = await fetch(
    `${server.baseUrl}/api/evidence/${httpEvidenceJson.data.id}`,
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
  assert.equal(invalidClearResponse.status, 400);
  const invalidClearJson = (await invalidClearResponse.json()) as {
    error: {
      code: string;
      message: string;
      details: Array<{ path: string }>;
    };
  };
  assert.equal(invalidClearJson.error.code, 'VALIDATION_ERROR');

  const storedAfterFailedClear = await prisma.evidence.findUnique({
    where: { id: httpEvidenceJson.data.id },
    include: {
      httpExchanges: {
        orderBy: { position: 'asc' },
        select: {
          position: true,
          request: true,
          response: true,
        },
      },
    },
  });
  assert.deepEqual(
    storedAfterFailedClear?.httpExchanges.map(
      (exchange: {
        request: { method: string };
        response: { statusCode: number };
      }) => exchange.request.method,
    ),
    ['GET', 'POST'],
  );

  const clearHttpExchangesResponse = await fetch(
    `${server.baseUrl}/api/evidence/${httpEvidenceJson.data.id}`,
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
  assert.equal(clearHttpExchangesResponse.status, 200);
  const clearedEvidenceJson = (await clearHttpExchangesResponse.json()) as {
    data: {
      type: string;
      httpExchanges: Array<{
        request: { method: string; url: string; body?: string };
        response: { statusCode: number; body?: string };
      }>;
    };
  };
  assert.equal(clearedEvidenceJson.data.type, 'text');
  assert.deepEqual(clearedEvidenceJson.data.httpExchanges, []);

  const storedClearedEvidence = await prisma.evidence.findUnique({
    where: { id: httpEvidenceJson.data.id },
    include: {
      httpExchanges: {
        orderBy: { position: 'asc' },
        select: {
          position: true,
          request: true,
          response: true,
        },
      },
    },
  });
  assert.equal(storedClearedEvidence?.httpExchanges.length, 0);

  const deleteResponse = await fetch(
    `${server.baseUrl}/api/evidence/${evidenceId}`,
    {
      method: 'DELETE',
    },
  );
  assert.equal(deleteResponse.status, 204);
  assert.equal(await deleteResponse.text(), '');

  const missingAfterDelete = await fetch(
    `${server.baseUrl}/api/evidence/${evidenceId}`,
  );
  assert.equal(missingAfterDelete.status, 404);
};

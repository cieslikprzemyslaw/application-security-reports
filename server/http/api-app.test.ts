import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';

import { z } from 'zod';

import { loadServerConfig } from '../config.js';
import type { ApiErrorResponse } from './api-errors.js';
import { createRequestValidationMiddleware } from './request-validation.js';
import { createApiApp } from './api-app.js';

const startTestServer = async (app: ReturnType<typeof createApiApp>) => {
  const server = createServer(app);

  await new Promise<void>(resolve => {
    server.listen(0, resolve);
  });

  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Expected the test server to listen on an ephemeral port.');
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: async () =>
      new Promise<void>((resolve, reject) => {
        server.close(error => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      }),
  };
};

const readJson = async <T>(response: Response) => response.json() as Promise<T>;

const allowedOrigin = 'http://localhost:5173';
const config = loadServerConfig({
  FRONTEND_ORIGIN: allowedOrigin,
});
const tempEvidenceDir = await mkdtemp(
  path.join(process.cwd(), 'uploads', 'evidence', 'api-app-test-'),
);
const tempEvidenceDirName = path.basename(tempEvidenceDir);
await writeFile(path.join(tempEvidenceDir, 'evidence.txt'), 'static evidence');
await writeFile(path.join(tempEvidenceDir, 'evidence.json'), '{"safe":true}');
await writeFile(path.join(tempEvidenceDir, 'unsafe.html'), '<h1>unsafe</h1>');

const app = createApiApp(config, {
  registerRoutes: router => {
    router.post('/echo', (req, res) => {
      res.json({
        body: req.body,
      });
    });

    router.post(
      '/validated',
      createRequestValidationMiddleware({
        body: z.object({
          name: z.string().min(1),
        }),
      }),
      (_req, res) => {
        res.json({
          body: res.locals.validatedRequest?.body,
        });
      },
    );

    router.get('/boom', () => {
      throw new Error('boom');
    });
  },
});

const server = await startTestServer(app);

try {
  const healthResponse = await fetch(`${server.baseUrl}/api/health`);

  assert.equal(healthResponse.status, 200);
  assert.deepEqual(await readJson(healthResponse), { status: 'ok' });
  assert.equal(
    healthResponse.headers.get('content-type')?.startsWith('application/json'),
    true,
  );
  assert.equal(healthResponse.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(healthResponse.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(
    healthResponse.headers.get('cross-origin-resource-policy'),
    'same-origin',
  );
  assert.equal(healthResponse.headers.get('x-powered-by'), null);

  const allowedCorsResponse = await fetch(`${server.baseUrl}/api/health`, {
    headers: {
      Origin: allowedOrigin,
    },
  });

  assert.equal(
    allowedCorsResponse.headers.get('access-control-allow-origin'),
    allowedOrigin,
  );
  assert.equal(
    allowedCorsResponse.headers.get('access-control-allow-credentials'),
    null,
  );

  const deniedCorsResponse = await fetch(`${server.baseUrl}/api/health`, {
    headers: {
      Origin: 'http://malicious.example',
    },
  });

  assert.equal(
    deniedCorsResponse.headers.get('access-control-allow-origin'),
    null,
  );

  const preflightResponse = await fetch(`${server.baseUrl}/api/echo`, {
    method: 'OPTIONS',
    headers: {
      Origin: allowedOrigin,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type',
    },
  });

  assert.equal(preflightResponse.status, 204);
  assert.equal(
    preflightResponse.headers.get('access-control-allow-origin'),
    allowedOrigin,
  );
  assert.equal(
    preflightResponse.headers.get('access-control-allow-methods'),
    'GET,POST,PATCH,DELETE',
  );
  assert.equal(
    preflightResponse.headers.get('access-control-allow-headers'),
    'Content-Type',
  );

  const parsedJsonResponse = await fetch(`${server.baseUrl}/api/echo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ hello: 'world' }),
  });

  assert.equal(parsedJsonResponse.status, 200);
  assert.deepEqual(await readJson(parsedJsonResponse), {
    body: { hello: 'world' },
  });

  const nearLimitPayload = 'a'.repeat(1024 * 1024 - 256);
  const withinLimitResponse = await fetch(`${server.baseUrl}/api/echo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ payload: nearLimitPayload }),
  });

  assert.equal(withinLimitResponse.status, 200);
  assert.deepEqual(await readJson(withinLimitResponse), {
    body: { payload: nearLimitPayload },
  });

  const malformedJsonResponse = await fetch(`${server.baseUrl}/api/echo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: '{',
  });

  assert.equal(malformedJsonResponse.status, 400);
  assert.deepEqual(await readJson(malformedJsonResponse), {
    error: {
      code: 'INVALID_JSON',
      message: 'Malformed JSON request body',
      details: [],
    },
  });

  const unsupportedContentTypeResponse = await fetch(
    `${server.baseUrl}/api/echo`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: '{}',
    },
  );

  assert.equal(unsupportedContentTypeResponse.status, 415);
  assert.deepEqual(await readJson(unsupportedContentTypeResponse), {
    error: {
      code: 'UNSUPPORTED_MEDIA_TYPE',
      message: 'Content-Type must be application/json',
      details: [],
    },
  });

  const oversizedPayload = 'a'.repeat(1024 * 1024 + 2048);
  const oversizedResponse = await fetch(`${server.baseUrl}/api/echo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ payload: oversizedPayload }),
  });

  assert.equal(oversizedResponse.status, 413);
  assert.deepEqual(await readJson(oversizedResponse), {
    error: {
      code: 'PAYLOAD_TOO_LARGE',
      message: 'JSON request body exceeds 1mb limit',
      details: [],
    },
  });

  const validationResponse = await fetch(`${server.baseUrl}/api/validated`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  assert.equal(validationResponse.status, 400);
  const validationJson = await readJson<ApiErrorResponse>(validationResponse);
  assert.equal(validationJson.error.code, 'VALIDATION_ERROR');
  assert.equal(validationJson.error.message, 'Request validation failed');
  assert.ok(
    Array.isArray(validationJson.error.details),
    'Expected validation details to be returned as an array',
  );
  assert.ok(
    validationJson.error.details.some(detail => detail.path === 'name'),
    'Expected the missing name field to be reported',
  );

  const notFoundResponse = await fetch(`${server.baseUrl}/api/does-not-exist`);

  assert.equal(notFoundResponse.status, 404);
  assert.deepEqual(await readJson(notFoundResponse), {
    error: {
      code: 'NOT_FOUND',
      message: 'API route not found',
      details: [],
    },
  });

  const unexpectedErrorResponse = await fetch(`${server.baseUrl}/api/boom`);

  assert.equal(unexpectedErrorResponse.status, 500);
  const unexpectedErrorJson = await readJson<ApiErrorResponse>(
    unexpectedErrorResponse,
  );
  assert.deepEqual(unexpectedErrorJson, {
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unexpected server error',
      details: [],
    },
  });
  assert.equal(
    JSON.stringify(unexpectedErrorJson).includes('boom'),
    false,
    'Expected the raw error message to stay out of the response',
  );
  assert.equal(
    JSON.stringify(unexpectedErrorJson).includes('stack'),
    false,
    'Expected stack traces to stay out of the response',
  );

  const staticEvidenceResponse = await fetch(
    `${server.baseUrl}/uploads/evidence/${tempEvidenceDirName}/evidence.txt`,
  );

  assert.equal(staticEvidenceResponse.status, 200);
  assert.equal(
    staticEvidenceResponse.headers
      .get('content-type')
      ?.startsWith('text/plain'),
    true,
  );
  assert.equal(
    staticEvidenceResponse.headers.get('x-content-type-options'),
    'nosniff',
  );
  assert.equal(
    staticEvidenceResponse.headers.get('cross-origin-resource-policy'),
    'same-origin',
  );
  assert.equal(await staticEvidenceResponse.text(), 'static evidence');

  const staticJsonResponse = await fetch(
    `${server.baseUrl}/uploads/evidence/${tempEvidenceDirName}/evidence.json`,
  );

  assert.equal(staticJsonResponse.status, 200);
  assert.equal(
    staticJsonResponse.headers
      .get('content-type')
      ?.startsWith('application/json'),
    true,
  );
  assert.equal(
    staticJsonResponse.headers.get('content-disposition'),
    'attachment',
  );

  const unsupportedStaticTypeResponse = await fetch(
    `${server.baseUrl}/uploads/evidence/${tempEvidenceDirName}/unsafe.html`,
  );

  assert.equal(unsupportedStaticTypeResponse.status, 404);
  const unsupportedStaticBody = await unsupportedStaticTypeResponse.text();
  assert.equal(unsupportedStaticBody, 'Not found');

  const directoryListingResponse = await fetch(
    `${server.baseUrl}/uploads/evidence/${tempEvidenceDirName}/`,
  );

  assert.equal(directoryListingResponse.status, 404);
  const directoryListingBody = await directoryListingResponse.text();
  assert.equal(directoryListingBody, 'Not found');
  assert.equal(
    directoryListingBody.includes(tempEvidenceDir),
    false,
    'Expected the directory response to avoid absolute path disclosure',
  );

  const traversalResponse = await fetch(
    `${server.baseUrl}/uploads/evidence/%2e%2e/%2e%2e/package.json`,
  );

  assert.equal(traversalResponse.status, 404);
  const traversalBody = await traversalResponse.text();
  assert.equal(traversalBody, 'Not found');
  assert.equal(
    traversalBody.includes(process.cwd()),
    false,
    'Expected traversal failures to avoid local path disclosure',
  );
} finally {
  await server.close();
  await rm(tempEvidenceDir, { recursive: true, force: true });
}

console.log('API application checks passed');

import assert from 'node:assert/strict';
import { createServer } from 'node:http';

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

  const allowedCorsResponse = await fetch(`${server.baseUrl}/api/health`, {
    headers: {
      Origin: allowedOrigin,
    },
  });

  assert.equal(
    allowedCorsResponse.headers.get('access-control-allow-origin'),
    allowedOrigin,
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
} finally {
  await server.close();
}

console.log('API application checks passed');

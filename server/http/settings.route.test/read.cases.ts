import assert from 'node:assert/strict';

import { RepositoryError } from '../../database/errors.js';
import {
  createSettingsRepositoryStub,
  defaultSettings,
  readJson,
  startSettingsTestServer,
  type ApiErrorBody,
} from './support.js';

export const runSettingsReadCases = async () => {
  {
    const { calls, repository } = createSettingsRepositoryStub({
      get: async () => defaultSettings,
    });
    const server = await startSettingsTestServer(repository);

    try {
      const response = await fetch(`${server.baseUrl}/api/settings`);

      assert.equal(response.status, 200);
      assert.deepEqual(
        await readJson<{ data: typeof defaultSettings }>(response),
        { data: defaultSettings },
      );
      assert.equal(calls.get, 1);
    } finally {
      await server.close();
    }
  }

  {
    const { calls, repository } = createSettingsRepositoryStub({
      get: async () => null,
    });
    const server = await startSettingsTestServer(repository);

    try {
      const response = await fetch(`${server.baseUrl}/api/settings`);

      assert.equal(response.status, 404);
      assert.equal(calls.get, 1);
      assert.deepEqual(await readJson(response), {
        error: {
          code: 'SETTINGS_NOT_FOUND',
          message: 'Settings not found',
          details: [],
        },
      });
    } finally {
      await server.close();
    }
  }

  {
    const { repository } = createSettingsRepositoryStub({
      get: async () => {
        throw new RepositoryError('boom');
      },
    });
    const server = await startSettingsTestServer(repository);

    try {
      const response = await fetch(`${server.baseUrl}/api/settings`);
      const body = await readJson<ApiErrorBody>(response);

      assert.equal(response.status, 500);
      assert.equal(body.error.code, 'INTERNAL_SERVER_ERROR');
      assert.equal(JSON.stringify(body).includes('boom'), false);
    } finally {
      await server.close();
    }
  }
};

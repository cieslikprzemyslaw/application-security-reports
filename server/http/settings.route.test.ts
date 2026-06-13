import assert from 'node:assert/strict';
import { createServer } from 'node:http';

import { loadServerConfig } from '../config.js';
import { RepositoryError } from '../database/errors.js';
import type { Settings } from '../../src/domain/settings.js';
import type { SettingsRepository } from '../database/repositories/settings.repository.js';
import { createApiApp } from './api-app.js';

const allowedOrigin = 'http://localhost:5173';
const config = loadServerConfig({
  FRONTEND_ORIGIN: allowedOrigin,
});

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

type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details: Array<{ path: string; message: string; code?: string }>;
  };
};

const readJson = async <T>(response: Response): Promise<T> =>
  response.json() as Promise<T>;

const defaultSettings = {
  id: 'set_00000000-0000-0000-0000-000000000001',
  organisationName: 'Northstar Digital',
  consultantName: 'Alex Mercer',
  consultantEmail: 'alex.mercer@appsec.io',
  defaultReportTitle: 'Application Security Assessment',
  defaultSeverity: 'medium',
  theme: 'system',
  dateFormat: 'YYYY-MM-DD',
  reportFooterText:
    '(c) 2026 Northstar Digital. Confidential - do not distribute.',
  methodology: 'OWASP ASVS / WSTG',
  reportStyle: 'Technical & structured',
  includeEvidence: true,
  confidentialReports: true,
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-11T09:00:00.000Z',
} satisfies Settings;

type SettingsRepositoryOverrides = Partial<{
  get: () => Promise<typeof defaultSettings | null>;
  upsert: (
    input: Parameters<SettingsRepository['upsert']>[0],
  ) => Promise<typeof defaultSettings>;
}>;

const createSettingsRepository = (
  overrides: SettingsRepositoryOverrides = {},
) => {
  const calls = {
    get: 0,
    upsert: 0,
    upsertArgs: undefined as
      | Parameters<SettingsRepository['upsert']>[0]
      | undefined,
  };

  const repository: SettingsRepository = {
    async get() {
      calls.get += 1;
      return overrides.get?.() ?? defaultSettings;
    },

    async upsert(input) {
      calls.upsert += 1;
      calls.upsertArgs = input;
      return (
        (await overrides.upsert?.(input)) ?? {
          ...defaultSettings,
          ...input,
        }
      );
    },
  };

  return { calls, repository };
};

const createApp = (repository: SettingsRepository) =>
  createApiApp(config, {
    settingsRepository: repository,
  });

{
  const { calls, repository } = createSettingsRepository({
    get: async () => defaultSettings,
  });
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(`${server.baseUrl}/api/settings`);

    assert.equal(response.status, 200);
    assert.deepEqual(
      await readJson<{ data: typeof defaultSettings }>(response),
      {
        data: defaultSettings,
      },
    );
    assert.equal(calls.get, 1);
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createSettingsRepository({
    get: async () => null,
  });
  const server = await startTestServer(createApp(repository));

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
  const { calls, repository } = createSettingsRepository({
    get: async () => defaultSettings,
    upsert: async input => ({
      ...defaultSettings,
      ...input,
      defaultReportTitle: 'Updated report title',
    }),
  });
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(`${server.baseUrl}/api/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        defaultReportTitle: 'Updated report title',
      }),
    });

    assert.equal(response.status, 200);
    const body = await readJson<{ data: typeof defaultSettings }>(response);
    assert.equal(body.data.defaultReportTitle, 'Updated report title');
    assert.equal(body.data.organisationName, defaultSettings.organisationName);
    assert.equal(calls.get, 1);
    assert.equal(calls.upsert, 1);
    assert.equal(calls.upsertArgs?.defaultReportTitle, 'Updated report title');
    assert.equal(
      calls.upsertArgs?.defaultSeverity,
      defaultSettings.defaultSeverity,
    );
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createSettingsRepository();
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(`${server.baseUrl}/api/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        theme: 'solarized',
      }),
    });

    assert.equal(response.status, 400);
    assert.equal(calls.get, 0);
    assert.equal(calls.upsert, 0);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(
      body.error.details.some(
        (detail: { path: string; message: string }) =>
          detail.path === 'theme' &&
          detail.message.includes('Invalid enum value'),
      ),
    );
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createSettingsRepository();
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(`${server.baseUrl}/api/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    assert.equal(response.status, 400);
    assert.equal(calls.get, 0);
    assert.equal(calls.upsert, 0);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(
      body.error.details.some((detail: { path: string; message: string }) =>
        detail.message.includes('At least one settings field is required'),
      ),
    );
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createSettingsRepository();
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(`${server.baseUrl}/api/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notifications: true,
      }),
    });

    assert.equal(response.status, 400);
    assert.equal(calls.get, 0);
    assert.equal(calls.upsert, 0);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(
      body.error.details.some(
        (detail: { path: string; message: string }) =>
          detail.path === 'notifications' &&
          detail.message.includes('Unknown property'),
      ),
    );
  } finally {
    await server.close();
  }
}

{
  const { repository } = createSettingsRepository({
    get: async () => {
      throw new RepositoryError('boom');
    },
  });
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(`${server.baseUrl}/api/settings`);

    assert.equal(response.status, 500);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'INTERNAL_SERVER_ERROR');
    assert.equal(JSON.stringify(body).includes('boom'), false);
  } finally {
    await server.close();
  }
}

console.log('settings API route checks passed');

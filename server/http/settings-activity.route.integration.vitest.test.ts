import assert from 'node:assert/strict';
import { createServer } from 'node:http';

import { afterEach, beforeEach, describe, it, vi } from 'vitest';

import { loadServerConfig } from '../config.js';
import { createSettingsRepository } from '../database/repositories/settings.repository.js';
import {
  createTemporaryDatabase,
  type TemporaryDatabase,
} from '../test/temporaryDatabase.js';
import { createApiApp } from './api-app.js';

type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details: Array<{ path?: string; message?: string; code?: string }>;
  };
};

const config = loadServerConfig({
  FRONTEND_ORIGIN: 'http://localhost:5173',
});

const startServer = async (database: TemporaryDatabase) => {
  const settingsRepository = createSettingsRepository(database.prisma);
  const app = createApiApp(config, { settingsRepository });
  const server = createServer(app);

  await new Promise<void>(resolve => {
    server.listen(0, resolve);
  });

  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Expected an ephemeral test port.');
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    settingsRepository,
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

const validSettings = {
  organisationName: 'Northstar Digital',
  consultantName: 'Alex Mercer',
  consultantEmail: 'alex.mercer@appsec.io',
  defaultReportTitle: 'Application Security Assessment',
  defaultSeverity: 'medium' as const,
  theme: 'system' as const,
  dateFormat: 'YYYY-MM-DD' as const,
  reportFooterText: 'Confidential - do not distribute.',
  reportConfidentialityLabel: 'Confidential',
  methodology: 'OWASP ASVS / WSTG',
  reportStyle: 'Technical & structured',
  includeEvidence: true,
  confidentialReports: true,
  allowedBrandingModes: ['issuer', 'client'] as Array<
    'issuer' | 'client' | 'none'
  >,
  defaultBrandingMode: 'issuer' as const,
};

describe('Settings and unsupported Activity API integration', () => {
  let database: TemporaryDatabase | undefined;
  let server: Awaited<ReturnType<typeof startServer>> | undefined;

  beforeEach(async () => {
    database = await createTemporaryDatabase();
    server = await startServer(database);
  });

  afterEach(async () => {
    await server?.close();
    await database?.cleanup();
    server = undefined;
    database = undefined;
  });

  const getContext = () => {
    if (!database || !server) {
      throw new Error('Integration context is not ready.');
    }

    return { database, server };
  };

  it('returns a safe Settings DTO and persists a valid PATCH', async () => {
    const { database, server } = getContext();
    const seeded = await server.settingsRepository.upsert(validSettings);

    const getResponse = await fetch(`${server.baseUrl}/api/settings`);
    assert.equal(getResponse.status, 200);
    const getBody = (await getResponse.json()) as {
      data: Record<string, unknown>;
    };

    assert.equal(getBody.data.id, seeded.id);
    assert.equal(getBody.data.organisationName, 'Northstar Digital');
    assert.equal('password' in getBody.data, false);
    assert.equal('token' in getBody.data, false);
    assert.equal('secret' in getBody.data, false);

    const patchResponse = await fetch(`${server.baseUrl}/api/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consultantName: 'Jordan Lee',
        includeEvidence: false,
      }),
    });

    assert.equal(patchResponse.status, 200);
    const patchBody = (await patchResponse.json()) as {
      data: { consultantName: string; includeEvidence: boolean };
    };
    assert.equal(patchBody.data.consultantName, 'Jordan Lee');
    assert.equal(patchBody.data.includeEvidence, false);
    assert.equal(await database.prisma.settings.count(), 1);
  });

  it('preserves Settings after invalid and empty writes', async () => {
    const { database, server } = getContext();
    await server.settingsRepository.upsert(validSettings);
    const before = await database.prisma.settings.findFirst();

    for (const body of [
      {},
      { issuerLogoId: '../uploads/logo.svg' },
      {
        allowedBrandingModes: ['issuer'],
        defaultBrandingMode: 'client',
      },
    ]) {
      const response = await fetch(`${server.baseUrl}/api/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      assert.equal(response.status, 400);
      const error = (await response.json()) as ApiErrorBody;
      assert.equal(error.error.code, 'VALIDATION_ERROR');
      assert.equal(Array.isArray(error.error.details), true);
      assert.deepEqual(await database.prisma.settings.findFirst(), before);
    }
  });

  it('returns safe not-found and unsupported-operation responses', async () => {
    const { server } = getContext();

    const defaultSettingsResponse = await fetch(
      `${server.baseUrl}/api/settings`,
    );
    assert.equal(defaultSettingsResponse.status, 200);

    const defaultSettingsBody = (await defaultSettingsResponse.json()) as {
      data: Record<string, unknown>;
    };

    assert.equal(typeof defaultSettingsBody.data, 'object');
    assert.equal('password' in defaultSettingsBody.data, false);
    assert.equal('token' in defaultSettingsBody.data, false);
    assert.equal('secret' in defaultSettingsBody.data, false);

    const unsupportedSettingsPost = await fetch(
      `${server.baseUrl}/api/settings`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validSettings),
      },
    );
    assert.equal(unsupportedSettingsPost.status, 404);

    const unsupportedActivityRoute = await fetch(
      `${server.baseUrl}/api/activity`,
    );
    assert.equal(unsupportedActivityRoute.status, 404);
    const activityBody =
      (await unsupportedActivityRoute.json()) as ApiErrorBody;
    assert.equal(Array.isArray(activityBody.error.details), true);
    assert.equal(
      JSON.stringify(activityBody).includes('consultantEmail'),
      false,
    );
  });

  it('does not leak database details when Settings persistence fails', async () => {
    const { database, server } = getContext();
    await server.settingsRepository.upsert(validSettings);
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    try {
      await database.prisma.$executeRawUnsafe(
        'ALTER TABLE "Settings" RENAME TO "SettingsUnavailable"',
      );

      const response = await fetch(`${server.baseUrl}/api/settings`);
      const body = (await response.json()) as ApiErrorBody;

      assert.equal(response.status, 500);
      assert.deepEqual(body, {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Unexpected server error',
          details: [],
        },
      });
      assert.equal(JSON.stringify(body).includes('no such table'), false);
      assert.equal(JSON.stringify(body).includes('SettingsUnavailable'), false);
      assert.equal(consoleError.mock.calls.length > 0, true);
    } finally {
      consoleError.mockRestore();
    }
  });
});

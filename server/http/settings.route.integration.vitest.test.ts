import { createServer } from 'node:http';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { loadServerConfig } from '../config.js';
import { createSettingsRepository } from '../database/repositories/settings.repository.js';
import {
  createTemporaryDatabase,
  type TemporaryDatabase,
} from '../test/temporaryDatabase.js';
import { createApiApp } from './api-app.js';

const config = loadServerConfig({
  FRONTEND_ORIGIN: 'http://localhost:5173',
});

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
  allowedBrandingModes: ['issuer', 'client'] as Array<'issuer' | 'client'>,
  defaultBrandingMode: 'issuer' as const,
};

const startServer = async (database: TemporaryDatabase) => {
  const settingsRepository = createSettingsRepository(database.prisma);
  const server = createServer(createApiApp(config, { settingsRepository }));

  await new Promise<void>(resolve => server.listen(0, resolve));
  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Expected an ephemeral test port.');
  }

  return {
    settingsRepository,
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: async () =>
      new Promise<void>((resolve, reject) => {
        server.close(error => (error ? reject(error) : resolve()));
      }),
  };
};

describe.sequential('Settings API integration', () => {
  let database: TemporaryDatabase;
  let server: Awaited<ReturnType<typeof startServer>>;

  beforeEach(async () => {
    database = await createTemporaryDatabase();
    server = await startServer(database);
  });

  afterEach(async () => {
    await server.close();
    await database.cleanup();
  });

  it('returns a safe DTO and persists valid updates', async () => {
    const seeded = await server.settingsRepository.upsert(validSettings);
    const getResponse = await fetch(`${server.baseUrl}/api/settings`);
    const getBody = (await getResponse.json()) as {
      data: Record<string, unknown>;
    };

    expect(getResponse.status).toBe(200);
    expect(getBody.data.id).toBe(seeded.id);
    expect(getBody.data).not.toHaveProperty('password');
    expect(getBody.data).not.toHaveProperty('token');
    expect(getBody.data).not.toHaveProperty('secret');

    const patchResponse = await fetch(`${server.baseUrl}/api/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consultantName: 'Jordan Lee',
        includeEvidence: false,
      }),
    });
    const patchBody = (await patchResponse.json()) as {
      data: { consultantName: string; includeEvidence: boolean };
    };

    expect(patchResponse.status).toBe(200);
    expect(patchBody.data).toMatchObject({
      consultantName: 'Jordan Lee',
      includeEvidence: false,
    });
    await expect(database.prisma.settings.count()).resolves.toBe(1);
  });

  it('preserves Settings after invalid and empty writes', async () => {
    await server.settingsRepository.upsert(validSettings);
    const before = await database.prisma.settings.findFirst();

    for (const body of [
      {},
      { issuerLogoId: '../uploads/logo.svg' },
      { allowedBrandingModes: ['issuer'], defaultBrandingMode: 'client' },
    ]) {
      const response = await fetch(`${server.baseUrl}/api/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      expect(response.status).toBe(400);
      await expect(database.prisma.settings.findFirst()).resolves.toEqual(
        before,
      );
    }
  });

  it('does not leak database details when persistence fails', async () => {
    await server.settingsRepository.upsert(validSettings);
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    try {
      await database.prisma.$executeRawUnsafe(
        'ALTER TABLE "Settings" RENAME TO "SettingsUnavailable"',
      );
      const response = await fetch(`${server.baseUrl}/api/settings`);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toEqual({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Unexpected server error',
          details: [],
        },
      });
      expect(JSON.stringify(body)).not.toContain('SettingsUnavailable');
    } finally {
      consoleError.mockRestore();
    }
  });
});

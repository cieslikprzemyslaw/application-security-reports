import { afterEach, describe, expect, it, vi } from 'vitest';

import { RepositoryError } from '../database/errors.js';
import { IssuerLogoStorageError } from '../services/issuerLogoStorage.js';
import {
  type ApiErrorBody,
  createApp,
  createRepository,
  createStorage,
  defaultSettings,
  pngBytes,
  readJson,
  startTestServer,
} from './settings-logo.route.test/support.js';

const servers: Array<{ close: () => Promise<void> }> = [];

const start = async (
  repository = createRepository(),
  storage = createStorage(),
) => {
  const server = await startTestServer(
    createApp(repository.repository, storage.storage),
  );
  servers.push(server);
  return { repository, storage, server };
};

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(servers.splice(0).map(server => server.close()));
});

describe('GET /api/settings/issuer-logo', () => {
  it('returns the managed logo bytes and safe content metadata', async () => {
    const { storage, server } = await start();

    const response = await fetch(`${server.baseUrl}/api/settings/issuer-logo`);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/png');
    expect(response.headers.get('content-length')).toBe(
      String(pngBytes.length),
    );
    expect(Buffer.from(await response.arrayBuffer())).toEqual(pngBytes);
    expect(storage.calls.readIssuerLogoFile).toHaveBeenCalledWith(
      defaultSettings.issuerLogoId,
    );
    expect(response.headers.get('x-powered-by')).toBeNull();
  });

  it('distinguishes missing Settings from a missing logo reference', async () => {
    const missingSettings = createRepository({ get: async () => null });
    const first = await start(missingSettings, createStorage());

    const missingSettingsResponse = await fetch(
      `${first.server.baseUrl}/api/settings/issuer-logo`,
    );
    expect(missingSettingsResponse.status).toBe(404);
    expect(
      (await readJson<ApiErrorBody>(missingSettingsResponse)).error.code,
    ).toBe('SETTINGS_NOT_FOUND');

    const noLogo = createRepository({
      get: async () => ({ ...defaultSettings, issuerLogoId: undefined }),
    });
    const second = await start(noLogo, createStorage());

    const noLogoResponse = await fetch(
      `${second.server.baseUrl}/api/settings/issuer-logo`,
    );
    expect(noLogoResponse.status).toBe(404);
    expect((await readJson<ApiErrorBody>(noLogoResponse)).error.code).toBe(
      'ISSUER_LOGO_NOT_FOUND',
    );
  });

  it('treats an unresolved managed reference as an internal storage error', async () => {
    const storage = createStorage({
      readIssuerLogoFile: async () => {
        throw new IssuerLogoStorageError(
          'C:\\private\\uploads\\issuer-logo.png',
        );
      },
    });
    const context = await start(createRepository(), storage);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await fetch(
      `${context.server.baseUrl}/api/settings/issuer-logo`,
    );
    const body = await readJson<ApiErrorBody>(response);

    expect(response.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(JSON.stringify(body)).not.toContain('C:\\private');
  });
});

describe('DELETE /api/settings/issuer-logo', () => {
  it('clears the Settings reference before cleaning up the managed file', async () => {
    const callOrder: string[] = [];
    const repository = createRepository({
      updateIssuerLogoId: async issuerLogoId => {
        callOrder.push(`settings:${String(issuerLogoId)}`);
        return { ...defaultSettings, issuerLogoId: undefined };
      },
    });
    const storage = createStorage({
      deleteIssuerLogoFile: async logoId => {
        callOrder.push(`file:${logoId}`);
      },
    });
    const context = await start(repository, storage);

    const response = await fetch(
      `${context.server.baseUrl}/api/settings/issuer-logo`,
      { method: 'DELETE' },
    );

    expect(response.status).toBe(204);
    expect(callOrder).toEqual([
      'settings:null',
      `file:${defaultSettings.issuerLogoId}`,
    ]);
  });

  it('is idempotent when Settings exist without a logo reference', async () => {
    const repository = createRepository({
      get: async () => ({ ...defaultSettings, issuerLogoId: undefined }),
    });
    const storage = createStorage();
    const context = await start(repository, storage);

    const response = await fetch(
      `${context.server.baseUrl}/api/settings/issuer-logo`,
      { method: 'DELETE' },
    );

    expect(response.status).toBe(204);
    expect(repository.calls.updateIssuerLogoId).not.toHaveBeenCalled();
    expect(storage.calls.deleteIssuerLogoFile).not.toHaveBeenCalled();
  });

  it('does not delete the file when clearing Settings fails', async () => {
    const repository = createRepository({
      updateIssuerLogoId: async () => {
        throw new RepositoryError('database unavailable');
      },
    });
    const storage = createStorage();
    const context = await start(repository, storage);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await fetch(
      `${context.server.baseUrl}/api/settings/issuer-logo`,
      { method: 'DELETE' },
    );

    expect(response.status).toBe(500);
    expect(storage.calls.deleteIssuerLogoFile).not.toHaveBeenCalled();
  });

  it('returns 204 after a best-effort cleanup failure', async () => {
    const cleanupError = new IssuerLogoStorageError('cleanup failed');
    const storage = createStorage({
      deleteIssuerLogoFile: async () => {
        throw cleanupError;
      },
    });
    const warning = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
    const context = await start(createRepository(), storage);

    const response = await fetch(
      `${context.server.baseUrl}/api/settings/issuer-logo`,
      { method: 'DELETE' },
    );

    expect(response.status).toBe(204);
    expect(warning).toHaveBeenCalledWith(
      'Failed to clean up unreferenced issuer logo file',
      cleanupError,
    );
  });

  it('returns SETTINGS_NOT_FOUND without touching storage', async () => {
    const repository = createRepository({ get: async () => null });
    const storage = createStorage();
    const context = await start(repository, storage);

    const response = await fetch(
      `${context.server.baseUrl}/api/settings/issuer-logo`,
      { method: 'DELETE' },
    );

    expect(response.status).toBe(404);
    expect((await readJson<ApiErrorBody>(response)).error.code).toBe(
      'SETTINGS_NOT_FOUND',
    );
    expect(storage.calls.deleteIssuerLogoFile).not.toHaveBeenCalled();
  });
});

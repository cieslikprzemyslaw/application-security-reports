import { afterEach, describe, expect, it, vi } from 'vitest';

import { RepositoryError } from '../database/errors.js';
import {
  IssuerLogoStorageError,
  IssuerLogoValidationError,
  issuerLogoMaxSizeBytes,
} from '../services/issuerLogoStorage.js';
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

const upload = (
  baseUrl: string,
  options: {
    body?: BodyInit;
    contentType?: string;
    fileName?: string;
  } = {},
) =>
  fetch(`${baseUrl}/api/settings/issuer-logo`, {
    method: 'PUT',
    headers: {
      'Content-Type': options.contentType ?? 'image/png',
      'X-File-Name': options.fileName ?? 'issuer-logo.png',
    },
    body: options.body ?? pngBytes,
  });

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(servers.splice(0).map(server => server.close()));
});

describe('PUT /api/settings/issuer-logo', () => {
  it('stages the file, updates Settings, and cleans up the previous logo', async () => {
    const { repository, storage, server } = await start();

    const response = await upload(server.baseUrl);

    expect(response.status).toBe(200);
    const body = await readJson<{ data: typeof defaultSettings }>(response);
    expect(body.data.issuerLogoId).toBe(
      'logo_00000000-0000-0000-0000-000000000002',
    );
    expect(JSON.stringify(body)).not.toContain('uploads/');
    expect(JSON.stringify(body)).not.toContain('storageKey');
    expect(repository.calls.get).toHaveBeenCalledTimes(1);
    expect(repository.calls.updateIssuerLogoId).toHaveBeenCalledWith(
      'logo_00000000-0000-0000-0000-000000000002',
    );
    expect(storage.calls.stageIssuerLogoFile).toHaveBeenCalledWith({
      logoId: 'logo_00000000-0000-0000-0000-000000000002',
      fileName: 'issuer-logo.png',
      bytes: pngBytes,
    });
    expect(storage.calls.deleteIssuerLogoFile).toHaveBeenCalledWith(
      defaultSettings.issuerLogoId,
    );
  });

  it('validates the file before repository access', async () => {
    const validationError = new IssuerLogoValidationError(
      'Issuer logo file name is not allowed',
    );
    const repository = createRepository();
    const storage = createStorage({
      validateIssuerLogoFile: () => {
        throw validationError;
      },
    });
    const context = await start(repository, storage);

    const response = await upload(context.server.baseUrl, {
      fileName: '../issuer-logo.png',
    });

    expect(response.status).toBe(422);
    expect(await readJson<ApiErrorBody>(response)).toEqual({
      error: {
        code: 'LOGO_VALIDATION_ERROR',
        message: validationError.message,
        details: [],
      },
    });
    expect(repository.calls.get).not.toHaveBeenCalled();
    expect(storage.calls.stageIssuerLogoFile).not.toHaveBeenCalled();
  });

  it('returns SETTINGS_NOT_FOUND without staging a file', async () => {
    const repository = createRepository({ get: async () => null });
    const storage = createStorage();
    const context = await start(repository, storage);

    const response = await upload(context.server.baseUrl);

    expect(response.status).toBe(404);
    expect((await readJson<ApiErrorBody>(response)).error.code).toBe(
      'SETTINGS_NOT_FOUND',
    );
    expect(storage.calls.createIssuerLogoId).not.toHaveBeenCalled();
    expect(storage.calls.stageIssuerLogoFile).not.toHaveBeenCalled();
  });

  it('removes the staged file when the Settings update fails', async () => {
    const repository = createRepository({
      updateIssuerLogoId: async () => {
        throw new RepositoryError('database unavailable');
      },
    });
    const storage = createStorage();
    const context = await start(repository, storage);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await upload(context.server.baseUrl);

    expect(response.status).toBe(500);
    expect((await readJson<ApiErrorBody>(response)).error).toEqual({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unexpected server error',
      details: [],
    });
    expect(storage.calls.deleteIssuerLogoFile).toHaveBeenCalledTimes(1);
    expect(storage.calls.deleteIssuerLogoFile).toHaveBeenCalledWith(
      'logo_00000000-0000-0000-0000-000000000002',
    );
  });

  it('keeps the valid new reference when old-file cleanup fails', async () => {
    const cleanupError = new IssuerLogoStorageError('cleanup failed');
    const repository = createRepository();
    const storage = createStorage({
      deleteIssuerLogoFile: async logoId => {
        if (logoId === defaultSettings.issuerLogoId) {
          throw cleanupError;
        }
      },
    });
    const warning = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
    const context = await start(repository, storage);

    const response = await upload(context.server.baseUrl);

    expect(response.status).toBe(200);
    expect(repository.calls.updateIssuerLogoId).toHaveBeenCalledTimes(1);
    expect(warning).toHaveBeenCalledWith(
      'Failed to clean up replaced issuer logo file',
      cleanupError,
    );
  });

  it('returns a safe 500 when staging fails', async () => {
    const repository = createRepository();
    const storage = createStorage({
      stageIssuerLogoFile: async () => {
        throw new IssuerLogoStorageError('C:\\private\\issuer-logo.png');
      },
    });
    const context = await start(repository, storage);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await upload(context.server.baseUrl);
    const body = await readJson<ApiErrorBody>(response);

    expect(response.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(JSON.stringify(body)).not.toContain('C:\\private');
    expect(repository.calls.updateIssuerLogoId).not.toHaveBeenCalled();
  });

  it('rejects empty and unsupported uploads with stable errors', async () => {
    const context = await start();

    const emptyResponse = await upload(context.server.baseUrl, {
      body: Buffer.alloc(0),
    });
    expect(emptyResponse.status).toBe(422);
    expect((await readJson<ApiErrorBody>(emptyResponse)).error.code).toBe(
      'LOGO_VALIDATION_ERROR',
    );

    const unsupportedResponse = await upload(context.server.baseUrl, {
      contentType: 'image/svg+xml',
      fileName: 'issuer-logo.svg',
      body: '<svg></svg>',
    });
    expect(unsupportedResponse.status).toBe(422);
    expect((await readJson<ApiErrorBody>(unsupportedResponse)).error.code).toBe(
      'LOGO_VALIDATION_ERROR',
    );
  });

  it('maps a body larger than 5 MB to LOGO_VALIDATION_ERROR', async () => {
    const context = await start();

    const response = await upload(context.server.baseUrl, {
      body: Buffer.alloc(issuerLogoMaxSizeBytes + 1, 0x89),
    });

    expect(response.status).toBe(422);
    expect(await readJson<ApiErrorBody>(response)).toEqual({
      error: {
        code: 'LOGO_VALIDATION_ERROR',
        message: 'Issuer logo file must be 5 MB or smaller',
        details: [],
      },
    });
    expect(context.repository.calls.get).not.toHaveBeenCalled();
  });
});

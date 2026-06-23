import { createServer } from 'node:http';

import { vi } from 'vitest';

import type { Settings } from '../../../src/domain/settings.js';
import { loadServerConfig } from '../../config.js';
import type { SettingsRepository } from '../../database/repositories/settings.repository.js';
import { createApiApp } from '../api-app.js';
import type { IssuerLogoStorage } from '../../services/issuerLogoStorage.js';

export const pngBytes = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);

export const defaultSettings: Settings = {
  id: 'set_00000000-0000-0000-0000-000000000001',
  organisationName: 'Northstar Digital',
  consultantName: 'Alex Mercer',
  consultantEmail: 'alex.mercer@appsec.io',
  issuerLogoId: 'logo_00000000-0000-0000-0000-000000000001',
  defaultReportTitle: 'Application Security Assessment',
  defaultSeverity: 'medium',
  theme: 'system',
  dateFormat: 'YYYY-MM-DD',
  reportFooterText: 'Confidential',
  reportConfidentialityLabel: 'Confidential',
  methodology: 'OWASP ASVS / WSTG',
  reportStyle: 'Technical & structured',
  includeEvidence: true,
  confidentialReports: true,
  allowedBrandingModes: ['issuer', 'client'],
  defaultBrandingMode: 'issuer',
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-23T09:00:00.000Z',
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details: Array<{ path: string; message: string; code?: string }>;
  };
};

type RepositoryOverrides = Partial<{
  get: SettingsRepository['get'];
  upsert: SettingsRepository['upsert'];
  updateIssuerLogoId: SettingsRepository['updateIssuerLogoId'];
}>;

export const createRepository = (overrides: RepositoryOverrides = {}) => {
  let currentSettings: Settings | null = defaultSettings;
  const calls = {
    get: vi.fn(),
    upsert: vi.fn(),
    updateIssuerLogoId: vi.fn(),
  };

  const repository: SettingsRepository = {
    async get() {
      calls.get();
      return overrides.get ? overrides.get() : currentSettings;
    },
    async upsert(input) {
      calls.upsert(input);

      if (overrides.upsert) {
        return overrides.upsert(input);
      }

      currentSettings = {
        ...(currentSettings ?? defaultSettings),
        ...input,
      };
      return currentSettings;
    },
    async updateIssuerLogoId(issuerLogoId) {
      calls.updateIssuerLogoId(issuerLogoId);

      if (overrides.updateIssuerLogoId) {
        return overrides.updateIssuerLogoId(issuerLogoId);
      }

      currentSettings = {
        ...(currentSettings ?? defaultSettings),
        issuerLogoId: issuerLogoId ?? undefined,
      };
      return currentSettings;
    },
  };

  return {
    calls,
    repository,
    setCurrentSettings(value: Settings | null) {
      currentSettings = value;
    },
  };
};

type StorageOverrides = Partial<{
  validateIssuerLogoFile: IssuerLogoStorage['validateIssuerLogoFile'];
  createIssuerLogoId: IssuerLogoStorage['createIssuerLogoId'];
  stageIssuerLogoFile: IssuerLogoStorage['stageIssuerLogoFile'];
  readIssuerLogoFile: IssuerLogoStorage['readIssuerLogoFile'];
  deleteIssuerLogoFile: IssuerLogoStorage['deleteIssuerLogoFile'];
}>;

export const createStorage = (overrides: StorageOverrides = {}) => {
  const calls = {
    validateIssuerLogoFile: vi.fn(),
    createIssuerLogoId: vi.fn(),
    stageIssuerLogoFile: vi.fn(),
    readIssuerLogoFile: vi.fn(),
    deleteIssuerLogoFile: vi.fn(),
  };

  const storage: IssuerLogoStorage = {
    validateIssuerLogoFile(input) {
      calls.validateIssuerLogoFile(input);
      return (
        overrides.validateIssuerLogoFile?.(input) ?? {
          fileName: input.fileName,
          mimeType: 'image/png',
          sizeBytes: input.sizeBytes,
        }
      );
    },
    createIssuerLogoId() {
      calls.createIssuerLogoId();
      return (
        overrides.createIssuerLogoId?.() ??
        'logo_00000000-0000-0000-0000-000000000002'
      );
    },
    async stageIssuerLogoFile(input) {
      calls.stageIssuerLogoFile(input);
      await overrides.stageIssuerLogoFile?.(input);
    },
    async readIssuerLogoFile(logoId) {
      calls.readIssuerLogoFile(logoId);
      return (
        (await overrides.readIssuerLogoFile?.(logoId)) ?? {
          bytes: pngBytes,
          mimeType: 'image/png',
        }
      );
    },
    async deleteIssuerLogoFile(logoId) {
      calls.deleteIssuerLogoFile(logoId);
      await overrides.deleteIssuerLogoFile?.(logoId);
    },
  };

  return { calls, storage };
};

const config = loadServerConfig({
  FRONTEND_ORIGIN: 'http://localhost:5173',
});

export const createApp = (
  settingsRepository: SettingsRepository,
  issuerLogoStorage: IssuerLogoStorage,
) =>
  createApiApp(config, {
    settingsRepository,
    issuerLogoStorage,
  });

export const startTestServer = async (app: ReturnType<typeof createApiApp>) => {
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
    close: async () =>
      new Promise<void>((resolve, reject) => {
        server.close(error => (error ? reject(error) : resolve()));
      }),
  };
};

export const readJson = async <T>(response: Response): Promise<T> =>
  response.json() as Promise<T>;

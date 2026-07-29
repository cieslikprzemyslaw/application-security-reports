import { createServer } from 'node:http';

import { loadServerConfig } from '../../config.js';
import type { SettingsRepository } from '../../database/repositories/settings.repository.js';
import type { Settings } from '../../../src/domain/settings.js';
import { createApiApp } from '../api-app.js';

export const defaultSettings: Settings = {
  id: 'set_00000000-0000-0000-0000-000000000001',
  organisationName: 'Northstar Digital',
  consultantName: 'Alex Mercer',
  consultantRole: 'Lead Pentester',
  consultantEmail: 'alex.mercer@appsec.io',
  issuerLogoId: 'logo_00000000-0000-0000-0000-000000000001',
  defaultReportTitle: 'Application Security Assessment',
  defaultSeverity: 'medium',
  theme: 'system',
  dateFormat: 'YYYY-MM-DD',
  reportFooterText:
    '(c) 2026 Northstar Digital. Confidential - do not distribute.',
  reportConfidentialityLabel: 'Confidential',
  methodology: 'OWASP ASVS / WSTG',
  reportStyle: 'Technical & structured',
  includeEvidence: true,
  confidentialReports: true,
  allowedBrandingModes: ['issuer', 'client'],
  defaultBrandingMode: 'issuer',
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-11T09:00:00.000Z',
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details: Array<{ path: string; message: string; code?: string }>;
  };
};

type SettingsRepositoryOverrides = Partial<{
  get: () => Promise<typeof defaultSettings | null>;
  upsert: (
    input: Parameters<SettingsRepository['upsert']>[0],
  ) => Promise<typeof defaultSettings>;
  updateIssuerLogoId: (
    issuerLogoId: string | null,
  ) => Promise<typeof defaultSettings>;
}>;

export const createSettingsRepositoryStub = (
  overrides: SettingsRepositoryOverrides = {},
) => {
  const calls = {
    get: 0,
    upsert: 0,
    upsertArgs: undefined as
      | Parameters<SettingsRepository['upsert']>[0]
      | undefined,
    updateIssuerLogoId: 0,
    updateIssuerLogoIdArg: undefined as string | null | undefined,
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
    async updateIssuerLogoId(issuerLogoId) {
      calls.updateIssuerLogoId += 1;
      calls.updateIssuerLogoIdArg = issuerLogoId;
      return (
        (await overrides.updateIssuerLogoId?.(issuerLogoId)) ?? {
          ...defaultSettings,
          issuerLogoId: issuerLogoId ?? undefined,
        }
      );
    },
  };

  return { calls, repository };
};

const config = loadServerConfig({
  FRONTEND_ORIGIN: 'http://localhost:5173',
});

export const startSettingsTestServer = async (
  repository: SettingsRepository,
) => {
  const server = createServer(
    createApiApp(config, { settingsRepository: repository }),
  );

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

export const readJson = async <T>(response: Response): Promise<T> =>
  response.json() as Promise<T>;

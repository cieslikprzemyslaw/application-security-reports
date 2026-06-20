import { createServer } from 'node:http';

import { loadServerConfig } from '../../config.js';
import {
  RepositoryConflictError,
  RepositoryConstraintError,
  RepositoryNotFoundError,
} from '../../database/errors.js';
import type {
  CompanyOverview,
  CompanyRepository,
} from '../../database/repositories/company.repository.js';
import {
  CompanyLogoValidationError,
  CompanyLogoStorageError,
  type CompanyLogoStorage,
} from '../../services/companyLogoStorage.js';
import { createApiApp } from '../api-app.js';

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

const defaultCompany = {
  id: 'cmp_00000000-0000-0000-0000-000000000001',
  name: 'Northstar Digital',
  description: 'Security consulting and managed assessment services',
  website: 'https://northstar.example',
  contactName: 'Alex Mercer',
  contactEmail: 'security@northstar.example',
  logoUrl: null as string | null,
  footerText: 'Confidential - do not distribute.',
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-11T09:00:00.000Z',
};

const defaultCompanyResponse = { ...defaultCompany };

const defaultOverview: CompanyOverview = {
  company: defaultCompany,
  assessmentCounts: { total: 2, draft: 1, inProgress: 1, completed: 0 },
  recentAssessments: [
    {
      id: 'asm_00000000-0000-0000-0000-000000000001',
      applicationName: 'Customer Portal',
      companyName: defaultCompany.name,
      assessmentType: 'Web App',
      severity: 'high',
      findingsCount: 3,
      status: 'in-progress',
    },
  ],
  recentReports: null,
};

const defaultOverviewResponse = {
  ...defaultOverview,
  company: defaultCompanyResponse,
};

type CompanyRepositoryOverrides = Partial<{
  findAll: () => Promise<Array<typeof defaultCompany>>;
  findById: (id: string) => Promise<typeof defaultCompany | null>;
  findOverview: (companyId: string) => Promise<CompanyOverview | null>;
  create: (
    input: Parameters<CompanyRepository['create']>[0],
    id?: string,
  ) => Promise<typeof defaultCompany>;
  update: (
    id: string,
    input: Parameters<CompanyRepository['update']>[1],
  ) => Promise<typeof defaultCompany>;
  updateLogoUrl: (
    id: string,
    logoUrl: string | null,
  ) => Promise<typeof defaultCompany>;
  delete: (id: string) => Promise<void>;
}>;

const createCompanyRepository = (
  overrides: CompanyRepositoryOverrides = {},
) => {
  const calls = {
    findAll: 0,
    findById: 0,
    findOverview: 0,
    create: 0,
    update: 0,
    updateLogoUrl: 0,
    delete: 0,
    createArgs: undefined as
      | {
          input: Parameters<CompanyRepository['create']>[0];
          id?: string;
        }
      | undefined,
    updateArgs: undefined as
      | {
          id: string;
          input: Parameters<CompanyRepository['update']>[1];
        }
      | undefined,
    updateLogoUrlArgs: undefined as
      | { id: string; logoUrl: string | null }
      | undefined,
  };

  const repository: CompanyRepository = {
    async findAll() {
      calls.findAll += 1;
      return overrides.findAll?.() ?? [defaultCompany];
    },

    async findById(id) {
      calls.findById += 1;
      return overrides.findById?.(id) ?? defaultCompany;
    },

    async findOverview(companyId) {
      calls.findOverview += 1;
      return overrides.findOverview?.(companyId) ?? defaultOverview;
    },

    async create(input, id) {
      calls.create += 1;
      calls.createArgs = { input, id };
      const resolvedId = id ?? defaultCompany.id;

      return (
        (await overrides.create?.(input, id)) ?? {
          ...defaultCompany,
          id: resolvedId,
          ...input,
        }
      );
    },

    async update(id, input) {
      calls.update += 1;
      calls.updateArgs = { id, input };
      return (
        (await overrides.update?.(id, input)) ?? {
          ...defaultCompany,
          id,
          ...input,
        }
      );
    },

    async updateLogoUrl(id, logoUrl) {
      calls.updateLogoUrl += 1;
      calls.updateLogoUrlArgs = { id, logoUrl };
      return (
        (await overrides.updateLogoUrl?.(id, logoUrl)) ?? {
          ...defaultCompany,
          id,
          logoUrl,
        }
      );
    },

    async delete(id) {
      calls.delete += 1;
      return overrides.delete?.(id);
    },
  };

  return { calls, repository };
};

type MockLogoStorageOverrides = Partial<{
  validateCompanyLogoFile: (
    input: Parameters<CompanyLogoStorage['validateCompanyLogoFile']>[0],
  ) => ReturnType<CompanyLogoStorage['validateCompanyLogoFile']>;
  buildCompanyLogoStorageKey: (
    companyId: string,
    fileName: string,
    logoId?: string,
  ) => string;
  readCompanyLogoFile: (storageKey: string) => Promise<Buffer>;
  deleteCompanyLogoFile: (storageKey: string) => Promise<void>;
  stageCompanyLogoReplacement: (
    input: Parameters<CompanyLogoStorage['stageCompanyLogoReplacement']>[0],
  ) => Promise<void>;
}>;

const defaultStorageKey = `uploads/company-logos/${defaultCompany.id}/logo_test.png`;
const defaultLogoBuffer = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

const createMockLogoStorage = (
  overrides: MockLogoStorageOverrides = {},
): CompanyLogoStorage => ({
  validateCompanyLogoFile(input) {
    return (
      overrides.validateCompanyLogoFile?.(input) ?? {
        fileName: input.fileName,
        mimeType: 'image/png' as const,
        sizeBytes: input.sizeBytes,
      }
    );
  },
  buildCompanyLogoStorageKey(companyId, fileName, logoId) {
    return (
      overrides.buildCompanyLogoStorageKey?.(companyId, fileName, logoId) ??
      defaultStorageKey
    );
  },
  async readCompanyLogoFile(storageKey) {
    return overrides.readCompanyLogoFile?.(storageKey) ?? defaultLogoBuffer;
  },
  async deleteCompanyLogoFile(storageKey) {
    return overrides.deleteCompanyLogoFile?.(storageKey);
  },
  async stageCompanyLogoReplacement(input) {
    return overrides.stageCompanyLogoReplacement?.(input);
  },
});

const createApp = (
  repository: CompanyRepository,
  logoStorage?: CompanyLogoStorage,
) =>
  createApiApp(config, {
    companyRepository: repository,
    logoStorage,
  });

export {
  RepositoryConflictError,
  RepositoryConstraintError,
  RepositoryNotFoundError,
  CompanyLogoValidationError,
  CompanyLogoStorageError,
  startTestServer,
  readJson,
  defaultCompany,
  defaultCompanyResponse,
  defaultOverview,
  defaultOverviewResponse,
  createCompanyRepository,
  createMockLogoStorage,
  defaultStorageKey,
  defaultLogoBuffer,
  createApp,
};

export type { ApiErrorBody };

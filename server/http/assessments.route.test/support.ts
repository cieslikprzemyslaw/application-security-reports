import { createServer } from 'node:http';

import {
  RepositoryConstraintError,
  RepositoryNotFoundError,
} from '../../database/errors.js';
import type { AssessmentRepository } from '../../database/repositories/assessment.repository.js';
import type { CompanyRepository } from '../../database/repositories/company.repository.js';
import type { EvidenceRepository } from '../../database/repositories/evidence.repository.js';
import type { ReportRepository } from '../../database/repositories/report.repository.js';
import type { ThreatRepository } from '../../database/repositories/threat.repository.js';
import type { Assessment } from '../../../src/domain/assessment.js';
import { OWASP_TOP_10_CURRENT_VERSION } from '../../../src/domain/owaspTop10.js';
import { loadServerConfig } from '../../config.js';
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
  logoUrl: null,
  footerText: 'Confidential - do not distribute.',
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-11T09:00:00.000Z',
};

const defaultAssessment: Assessment = {
  id: 'asm_00000000-0000-0000-0000-000000000001',
  companyId: defaultCompany.id,
  title: 'Customer Services Portal',
  description: 'Assessment of the customer portal',
  scope: 'Web application',
  status: 'in-progress',
  startedAt: '2026-06-01',
  completedAt: '2026-06-10',
  applicationName: 'Customer Services Portal',
  environment: 'Production',
  assessmentType: 'Web App',
  overallRisk: 'high',
  owaspTaxonomyVersion: OWASP_TOP_10_CURRENT_VERSION,
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-11T09:00:00.000Z',
};

type AssessmentRepositoryOverrides = Partial<{
  findAll: () => Promise<Array<typeof defaultAssessment>>;
  findById: (id: string) => Promise<typeof defaultAssessment | null>;
  findByCompanyId: (
    companyId: string,
  ) => Promise<Array<typeof defaultAssessment>>;
  create: (
    input: Parameters<AssessmentRepository['create']>[0],
  ) => Promise<typeof defaultAssessment>;
  update: (
    id: string,
    input: Parameters<AssessmentRepository['update']>[1],
  ) => Promise<typeof defaultAssessment>;
  delete: (id: string) => Promise<void>;
}>;

type CompanyRepositoryOverrides = Partial<{
  findById: (id: string) => Promise<typeof defaultCompany | null>;
}>;

const createAssessmentRepository = (
  overrides: AssessmentRepositoryOverrides = {},
) => {
  const calls = {
    findAll: 0,
    findById: 0,
    findByCompanyId: 0,
    create: 0,
    update: 0,
    delete: 0,
    createArgs: undefined as
      | {
          input: Parameters<AssessmentRepository['create']>[0];
        }
      | undefined,
    updateArgs: undefined as
      | {
          id: string;
          input: Parameters<AssessmentRepository['update']>[1];
        }
      | undefined,
  };

  const repository: AssessmentRepository = {
    async findAll() {
      calls.findAll += 1;
      return overrides.findAll?.() ?? [defaultAssessment];
    },

    async findById(id) {
      calls.findById += 1;
      return overrides.findById?.(id) ?? defaultAssessment;
    },

    async findByCompanyId(companyId) {
      calls.findByCompanyId += 1;
      return overrides.findByCompanyId?.(companyId) ?? [defaultAssessment];
    },

    async create(input) {
      calls.create += 1;
      calls.createArgs = { input };
      return (
        (await overrides.create?.(input)) ?? {
          ...defaultAssessment,
          ...input,
        }
      );
    },

    async update(id, input) {
      calls.update += 1;
      calls.updateArgs = { id, input };
      return (
        (await overrides.update?.(id, input)) ?? {
          ...defaultAssessment,
          id,
          ...input,
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

const createCompanyRepository = (
  overrides: CompanyRepositoryOverrides = {},
) => {
  const calls = {
    findById: 0,
  };

  const repository: CompanyRepository = {
    async findAll() {
      return [defaultCompany];
    },

    async findById(id) {
      calls.findById += 1;
      return overrides.findById?.(id) ?? defaultCompany;
    },

    async findOverview() {
      return null;
    },

    async create(input, id) {
      return {
        ...defaultCompany,
        id: id ?? defaultCompany.id,
        ...input,
      };
    },

    async update(id, input) {
      return {
        ...defaultCompany,
        id,
        ...input,
      };
    },

    async updateLogoUrl(id, logoUrl) {
      return {
        ...defaultCompany,
        id,
        logoUrl,
      };
    },
    async delete() {
      return undefined;
    },
  };

  return { calls, repository };
};

const createThreatRepository = (): ThreatRepository => ({
  async findById() {
    return null;
  },

  async findByAssessmentId() {
    return [];
  },

  async create() {
    throw new Error(
      'Threat repository stub should not be called in assessment route tests.',
    );
  },

  async update() {
    throw new Error(
      'Threat repository stub should not be called in assessment route tests.',
    );
  },

  async delete() {
    throw new Error(
      'Threat repository stub should not be called in assessment route tests.',
    );
  },
});

const createEvidenceRepository = (): EvidenceRepository => ({
  async findById() {
    return null;
  },

  async findByAssessmentId() {
    return [];
  },

  async create() {
    throw new Error(
      'Evidence repository stub should not be called in assessment route tests.',
    );
  },

  async update() {
    throw new Error(
      'Evidence repository stub should not be called in assessment route tests.',
    );
  },

  async delete() {
    throw new Error(
      'Evidence repository stub should not be called in assessment route tests.',
    );
  },

  async attachToThreat() {
    throw new Error(
      'Evidence repository stub should not be called in assessment route tests.',
    );
  },

  async detachFromThreat() {
    throw new Error(
      'Evidence repository stub should not be called in assessment route tests.',
    );
  },
});

const createReportRepository = (): ReportRepository => ({
  async findById() {
    return null;
  },

  async findByAssessmentId() {
    return [];
  },

  async create() {
    throw new Error(
      'Report repository stub should not be called in assessment route tests.',
    );
  },

  async update() {
    throw new Error(
      'Report repository stub should not be called in assessment route tests.',
    );
  },

  async delete() {
    throw new Error(
      'Report repository stub should not be called in assessment route tests.',
    );
  },

  async attachThreat() {
    throw new Error(
      'Report repository stub should not be called in assessment route tests.',
    );
  },

  async detachThreat() {
    throw new Error(
      'Report repository stub should not be called in assessment route tests.',
    );
  },
});
const createApp = (
  assessmentRepository: AssessmentRepository,
  companyRepository: CompanyRepository,
) =>
  createApiApp(config, {
    assessmentRepository,
    companyRepository,
    threatRepository: createThreatRepository(),
    evidenceRepository: createEvidenceRepository(),
    reportRepository: createReportRepository(),
  });

export {
  RepositoryConstraintError,
  RepositoryNotFoundError,
  startTestServer,
  readJson,
  defaultCompany,
  defaultAssessment,
  createAssessmentRepository,
  createCompanyRepository,
  createApp,
};

export type { ApiErrorBody };

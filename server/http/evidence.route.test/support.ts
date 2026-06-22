import { createServer } from 'node:http';

import { loadServerConfig } from '../../config.js';
import type { Assessment } from '../../../src/domain/assessment.js';
import type { Evidence } from '../../../src/domain/evidence.js';
import type { Threat } from '../../../src/domain/threat.js';
import type { AssessmentRepository } from '../../database/repositories/assessment.repository.js';
import type { EvidenceRepository } from '../../database/repositories/evidence.repository.js';
import type { ThreatRepository } from '../../database/repositories/threat.repository.js';
import { createApiApp } from '../api-app.js';

const allowedOrigin = 'http://localhost:5173';
const config = loadServerConfig({
  FRONTEND_ORIGIN: allowedOrigin,
});

export const startTestServer = async (app: ReturnType<typeof createApiApp>) => {
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

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details: Array<{ path: string; message: string; code?: string }>;
  };
};

export const readJson = async <T>(response: Response): Promise<T> =>
  response.json() as Promise<T>;

export const defaultAssessment: Assessment = {
  id: 'asm_00000000-0000-0000-0000-000000000001',
  companyId: 'cmp_00000000-0000-0000-0000-000000000001',
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
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-11T09:00:00.000Z',
};

export const otherAssessment: Assessment = {
  ...defaultAssessment,
  id: 'asm_00000000-0000-0000-0000-000000000002',
  title: 'External assessment',
};

export const defaultThreat: Threat = {
  id: 'thr_00000000-0000-0000-0000-000000000001',
  assessmentId: defaultAssessment.id,
  title: 'Missing Server-Side Authorization',
  description: 'The endpoint returns another customer order.',
  severity: 'critical',
  strideCategories: ['spoofing', 'tampering'],
  status: 'accepted-risk',
  affectedAsset: '/api/v1/orders/{id}',
  impact: 'Unauthorised access to customer order data',
  recommendation: 'Apply object-level authorization on every request.',
  observation: 'An authenticated user can access another customer order.',
  affectedComponent: 'Orders API',
  affectedEndpoint: '/api/v1/orders/{id}',
  risk: 'Sensitive order data is exposed.',
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-11T09:00:00.000Z',
};

export const otherThreat: Threat = {
  ...defaultThreat,
  id: 'thr_00000000-0000-0000-0000-000000000002',
  assessmentId: otherAssessment.id,
  title: 'Different assessment threat',
};

export const defaultEvidence: Evidence = {
  id: 'evd_00000000-0000-0000-0000-000000000001',
  assessmentId: defaultAssessment.id,
  threatIds: [defaultThreat.id],
  type: 'screenshot',
  title: 'Evidence screenshot',
  description: 'Portal screenshot',
  content: 'Base64 payload',
  fileName: 'evidence.png',
  filePath: 'uploads/evidence/evidence.png',
  mimeType: 'image/png',
  capturedAt: '2026-06-05',
  createdAt: '2026-06-05T00:00:00.000Z',
  updatedAt: '2026-06-05T00:00:00.000Z',
};

type AssessmentRepositoryOverrides = Partial<{
  findById: (id: string) => Promise<Assessment | null>;
}>;

type ThreatRepositoryOverrides = Partial<{
  findById: (id: string) => Promise<Threat | null>;
}>;

type EvidenceRepositoryOverrides = Partial<{
  findById: (id: string) => Promise<Evidence | null>;
  findByAssessmentId: (assessmentId: string) => Promise<Array<Evidence>>;
  create: (
    input: Parameters<EvidenceRepository['create']>[0],
  ) => Promise<Evidence>;
  update: (
    id: string,
    input: Parameters<EvidenceRepository['update']>[1],
  ) => Promise<Evidence>;
  delete: (id: string) => Promise<void>;
}>;

export const createAssessmentRepository = (
  overrides: AssessmentRepositoryOverrides = {},
) => {
  const calls = {
    findById: 0,
  };

  const repository: AssessmentRepository = {
    async findAll() {
      return [defaultAssessment];
    },

    async findById(id) {
      calls.findById += 1;
      return overrides.findById?.(id) ?? defaultAssessment;
    },

    async findByCompanyId() {
      return [defaultAssessment];
    },

    async create(input) {
      return {
        ...defaultAssessment,
        ...input,
      };
    },

    async update(id, input) {
      return {
        ...defaultAssessment,
        id,
        ...input,
      };
    },

    async delete() {
      return undefined;
    },
  };

  return { calls, repository };
};

export const createThreatRepository = (
  overrides: ThreatRepositoryOverrides = {},
) => {
  const calls = {
    findById: 0,
  };

  const repository: ThreatRepository = {
    async findById(id) {
      calls.findById += 1;
      return overrides.findById?.(id) ?? defaultThreat;
    },

    async findByAssessmentId() {
      return [defaultThreat];
    },

    async create(input) {
      return {
        ...defaultThreat,
        ...input,
      };
    },

    async update(id, input) {
      return {
        ...defaultThreat,
        id,
        ...input,
      };
    },

    async delete() {
      return undefined;
    },
  };

  return { calls, repository };
};

export const createEvidenceRepository = (
  overrides: EvidenceRepositoryOverrides = {},
) => {
  const calls = {
    findById: 0,
    findByAssessmentId: 0,
    create: 0,
    update: 0,
    delete: 0,
    createArgs: undefined as
      | {
          input: Parameters<EvidenceRepository['create']>[0];
        }
      | undefined,
    updateArgs: undefined as
      | {
          id: string;
          input: Parameters<EvidenceRepository['update']>[1];
        }
      | undefined,
  };

  const repository: EvidenceRepository = {
    async findById(id) {
      calls.findById += 1;
      return overrides.findById?.(id) ?? defaultEvidence;
    },

    async findByAssessmentId(assessmentId) {
      calls.findByAssessmentId += 1;
      return overrides.findByAssessmentId?.(assessmentId) ?? [defaultEvidence];
    },

    async create(input) {
      calls.create += 1;
      calls.createArgs = { input };
      const storageKey = input.fileName
        ? `uploads/evidence/mock/${input.fileName}`
        : defaultEvidence.filePath;
      return (
        (await overrides.create?.(input)) ?? {
          ...defaultEvidence,
          ...input,
          filePath: storageKey,
          storageKey,
          httpExchanges: input.httpExchanges ?? [],
        }
      );
    },

    async update(id, input) {
      calls.update += 1;
      calls.updateArgs = { id, input };
      const storageKey = input.fileName
        ? `uploads/evidence/mock/${input.fileName}`
        : defaultEvidence.filePath;
      return (
        (await overrides.update?.(id, input)) ?? {
          ...defaultEvidence,
          id,
          ...input,
          filePath: storageKey,
          storageKey,
          httpExchanges: input.httpExchanges ?? defaultEvidence.httpExchanges,
        }
      );
    },

    async delete(id) {
      calls.delete += 1;
      return overrides.delete?.(id);
    },

    async attachToThreat() {
      return undefined;
    },

    async detachFromThreat() {
      return undefined;
    },
  };

  return { calls, repository };
};

export const createApp = (
  assessmentRepository: AssessmentRepository,
  threatRepository: ThreatRepository,
  evidenceRepository: EvidenceRepository,
) =>
  createApiApp(config, {
    assessmentRepository,
    threatRepository,
    evidenceRepository,
  });

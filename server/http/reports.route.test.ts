import assert from 'node:assert/strict';
import { createServer } from 'node:http';

import { loadServerConfig } from '../config.js';
import type { Assessment } from '../../src/domain/assessment.js';
import type { Company } from '../../src/domain/company.js';
import type { Evidence } from '../../src/domain/evidence.js';
import type { Report } from '../../src/domain/report.js';
import type { Settings } from '../../src/domain/settings.js';
import type { Threat } from '../../src/domain/threat.js';
import type { AssessmentRepository } from '../database/repositories/assessment.repository.js';
import type { CompanyRepository } from '../database/repositories/company.repository.js';
import type { EvidenceRepository } from '../database/repositories/evidence.repository.js';
import type { ReportRepository } from '../database/repositories/report.repository.js';
import type { SettingsRepository } from '../database/repositories/settings.repository.js';
import type { ThreatRepository } from '../database/repositories/threat.repository.js';
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

const defaultCompany: Company = {
  id: 'cmp_00000000-0000-0000-0000-000000000001',
  name: 'Northstar Digital',
  description: 'Security consulting and managed assessment services',
  website: 'https://northstar.example',
  contactName: 'Alex Mercer',
  contactEmail: 'security@northstar.example',
  logoPath: '/logos/northstar.svg',
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
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-11T09:00:00.000Z',
};

const threatA: Threat = {
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

const threatB: Threat = {
  ...threatA,
  id: 'thr_00000000-0000-0000-0000-000000000002',
  title: 'Verbose Error Messages',
  severity: 'medium',
  status: 'mitigated',
  strideCategories: ['information-disclosure'],
};

const foreignThreat: Threat = {
  ...threatA,
  id: 'thr_00000000-0000-0000-0000-000000000099',
  assessmentId: 'asm_00000000-0000-0000-0000-000000000099',
  title: 'Foreign threat',
};

const evidenceLate: Evidence = {
  id: 'evd_00000000-0000-0000-0000-000000000001',
  assessmentId: defaultAssessment.id,
  threatIds: [threatB.id],
  type: 'note',
  title: 'Late note',
  description: 'Second evidence entry',
  content: 'Late content',
  fileName: 'late.txt',
  filePath: 'uploads/evidence/late.txt',
  mimeType: 'text/plain',
  capturedAt: '2026-06-03',
  createdAt: '2026-06-03T12:00:00.000Z',
  updatedAt: '2026-06-03T12:00:00.000Z',
};

const evidenceEarly: Evidence = {
  ...evidenceLate,
  id: 'evd_00000000-0000-0000-0000-000000000002',
  title: 'Early note',
  content: 'Early content',
  fileName: 'early.txt',
  filePath: 'uploads/evidence/early.txt',
  capturedAt: '2026-06-02',
  createdAt: '2026-06-02T12:00:00.000Z',
  updatedAt: '2026-06-02T12:00:00.000Z',
};

const evidenceForThreatA: Evidence = {
  ...evidenceLate,
  id: 'evd_00000000-0000-0000-0000-000000000003',
  threatIds: [threatA.id],
  title: 'Threat A note',
  fileName: 'a.txt',
  filePath: 'uploads/evidence/a.txt',
  capturedAt: '2026-06-01',
  createdAt: '2026-06-01T12:00:00.000Z',
  updatedAt: '2026-06-01T12:00:00.000Z',
};

const report: Report = {
  id: 'rpt_00000000-0000-0000-0000-000000000001',
  assessmentId: defaultAssessment.id,
  title: 'Application Security Assessment',
  status: 'draft',
  selectedThreatIds: [threatB.id, threatA.id],
  latestVersion: 0,
  executiveSummary: 'Executive summary',
  createdAt: '2026-06-11T09:00:00.000Z',
  updatedAt: '2026-06-11T09:00:00.000Z',
};

const settings: Settings = {
  id: 'set_00000000-0000-0000-0000-000000000001',
  organisationName: 'Northstar Digital',
  consultantName: 'Alex Mercer',
  consultantEmail: 'alex.mercer@example.com',
  issuerLogoId: 'logo_00000000-0000-0000-0000-000000000001',
  defaultReportTitle: 'Application Security Assessment',
  defaultSeverity: 'medium',
  theme: 'system',
  dateFormat: 'YYYY-MM-DD',
  reportFooterText: 'Confidential',
  reportConfidentialityLabel: 'Strictly confidential',
  methodology: 'OWASP ASVS / WSTG',
  reportStyle: 'Technical & structured',
  includeEvidence: true,
  confidentialReports: true,
  allowedBrandingModes: ['issuer', 'client'],
  defaultBrandingMode: 'issuer',
  createdAt: '2026-06-11T09:00:00.000Z',
  updatedAt: '2026-06-11T09:00:00.000Z',
};

type ReportRepositoryOverrides = Partial<{
  findById: (id: string) => Promise<Report | null>;
}>;

type AssessmentRepositoryOverrides = Partial<{
  findById: (id: string) => Promise<Assessment | null>;
}>;

type CompanyRepositoryOverrides = Partial<{
  findById: (id: string) => Promise<Company | null>;
}>;

type ThreatRepositoryOverrides = Partial<{
  findByAssessmentId: (assessmentId: string) => Promise<Threat[]>;
}>;

type EvidenceRepositoryOverrides = Partial<{
  findByAssessmentId: (assessmentId: string) => Promise<Evidence[]>;
}>;

type SettingsRepositoryOverrides = Partial<{
  get: () => Promise<Settings | null>;
}>;

const createReportRepository = (overrides: ReportRepositoryOverrides = {}) => {
  let findByIdCalls = 0;

  const repository: ReportRepository = {
    async findById(id) {
      findByIdCalls += 1;
      return overrides.findById?.(id) ?? report;
    },
    async findByAssessmentId() {
      return [report];
    },
    async create() {
      return report;
    },
    async update() {
      return report;
    },
    async delete() {
      return undefined;
    },
    async attachThreat() {
      return undefined;
    },
    async detachThreat() {
      return undefined;
    },
  };

  return { findByIdCalls: () => findByIdCalls, repository };
};

const createAssessmentRepository = (
  overrides: AssessmentRepositoryOverrides = {},
) => {
  let findByIdCalls = 0;

  const repository: AssessmentRepository = {
    async findAll() {
      return [defaultAssessment];
    },
    async findById(id) {
      findByIdCalls += 1;
      return overrides.findById?.(id) ?? defaultAssessment;
    },
    async findByCompanyId() {
      return [defaultAssessment];
    },
    async create() {
      return defaultAssessment;
    },
    async update() {
      return defaultAssessment;
    },
    async delete() {
      return undefined;
    },
  };

  return { findByIdCalls: () => findByIdCalls, repository };
};

const createCompanyRepository = (
  overrides: CompanyRepositoryOverrides = {},
) => {
  let findByIdCalls = 0;

  const repository: CompanyRepository = {
    async findAll() {
      return [defaultCompany];
    },
    async findById(id) {
      findByIdCalls += 1;
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
    async delete() {
      return undefined;
    },
  };

  return { findByIdCalls: () => findByIdCalls, repository };
};

const createThreatRepository = (overrides: ThreatRepositoryOverrides = {}) => {
  let findByAssessmentIdCalls = 0;

  const repository: ThreatRepository = {
    async findById() {
      return threatA;
    },
    async findByAssessmentId(assessmentId) {
      findByAssessmentIdCalls += 1;
      return overrides.findByAssessmentId?.(assessmentId) ?? [threatA, threatB];
    },
    async create() {
      return threatA;
    },
    async update() {
      return threatA;
    },
    async delete() {
      return undefined;
    },
  };

  return {
    findByAssessmentIdCalls: () => findByAssessmentIdCalls,
    repository,
  };
};

const createEvidenceRepository = (
  overrides: EvidenceRepositoryOverrides = {},
) => {
  let findByAssessmentIdCalls = 0;

  const repository: EvidenceRepository = {
    async findById() {
      return evidenceEarly;
    },
    async findByAssessmentId(assessmentId) {
      findByAssessmentIdCalls += 1;
      return (
        overrides.findByAssessmentId?.(assessmentId) ?? [
          evidenceLate,
          evidenceEarly,
          evidenceForThreatA,
        ]
      );
    },
    async create() {
      return evidenceEarly;
    },
    async update() {
      return evidenceEarly;
    },
    async delete() {
      return undefined;
    },
    async attachToThreat() {
      return undefined;
    },
    async detachFromThreat() {
      return undefined;
    },
  };

  return {
    findByAssessmentIdCalls: () => findByAssessmentIdCalls,
    repository,
  };
};

const createSettingsRepository = (
  overrides: SettingsRepositoryOverrides = {},
) => {
  let getCalls = 0;

  const repository: SettingsRepository = {
    async get() {
      getCalls += 1;
      return overrides.get?.() ?? settings;
    },
    async upsert() {
      return settings;
    },
  };

  return { getCalls: () => getCalls, repository };
};

const createApp = (
  reportRepository: ReportRepository,
  assessmentRepository: AssessmentRepository,
  companyRepository: CompanyRepository,
  threatRepository: ThreatRepository,
  evidenceRepository: EvidenceRepository,
  settingsRepository: SettingsRepository,
) =>
  createApiApp(config, {
    reportRepository,
    assessmentRepository,
    companyRepository,
    threatRepository,
    evidenceRepository,
    settingsRepository,
  });

{
  const { repository: reportRepository } = createReportRepository({
    findById: async () => report,
  });
  const { repository: assessmentRepository } = createAssessmentRepository();
  const { repository: companyRepository } = createCompanyRepository();
  const { repository: threatRepository } = createThreatRepository({
    findByAssessmentId: async () => [threatB, threatA],
  });
  const { repository: evidenceRepository } = createEvidenceRepository({
    findByAssessmentId: async () => [
      evidenceLate,
      evidenceEarly,
      evidenceForThreatA,
    ],
  });
  const { repository: settingsRepository } = createSettingsRepository();
  const server = await startTestServer(
    createApp(
      reportRepository,
      assessmentRepository,
      companyRepository,
      threatRepository,
      evidenceRepository,
      settingsRepository,
    ),
  );

  try {
    const response = await fetch(`${server.baseUrl}/api/reports/${report.id}`);

    assert.equal(response.status, 200);
    const body = await readJson<{
      data: {
        report: Report;
        assessments: Array<{
          assessment: Assessment;
          findings: Array<{
            threat: Threat;
            evidence: Array<{ id: string; filePath?: never }>;
          }>;
        }>;
        branding: {
          issuerLogoId?: string;
          reportConfidentialityLabel?: string;
          defaultBrandingMode?: string;
        };
        snapshot: {
          branding: {
            issuerLogoId?: string;
            confidentialityLabel?: string;
            brandingMode?: string;
          };
        };
      };
    }>(response);
    assert.equal(body.data.report.id, report.id);
    assert.equal(body.data.assessments.length, 1);
    assert.equal(body.data.assessments[0]?.findings[0]?.threat.id, threatB.id);
    assert.equal(body.data.assessments[0]?.findings[1]?.threat.id, threatA.id);
    assert.deepEqual(
      body.data.assessments[0]?.findings[0]?.evidence.map(item => item.id),
      [evidenceEarly.id, evidenceLate.id],
    );
    assert.deepEqual(
      body.data.assessments[0]?.findings[1]?.evidence.map(item => item.id),
      [evidenceForThreatA.id],
    );
    assert.equal(
      'filePath' in (body.data.assessments[0]?.findings[0]?.evidence[0] ?? {}),
      false,
    );
    assert.equal(
      body.data.branding.issuerLogoId,
      'logo_00000000-0000-0000-0000-000000000001',
    );
    assert.equal(
      body.data.branding.reportConfidentialityLabel,
      'Strictly confidential',
    );
    assert.equal(body.data.branding.defaultBrandingMode, 'issuer');
    assert.equal(
      body.data.snapshot.branding.issuerLogoId,
      'logo_00000000-0000-0000-0000-000000000001',
    );
    assert.equal(
      body.data.snapshot.branding.confidentialityLabel,
      'Strictly confidential',
    );
    assert.equal(body.data.snapshot.branding.brandingMode, 'issuer');
  } finally {
    await server.close();
  }
}

{
  const { repository: reportRepository } = createReportRepository();
  const { findByIdCalls, repository: assessmentRepository } =
    createAssessmentRepository();
  const { repository: companyRepository } = createCompanyRepository();
  const { repository: threatRepository } = createThreatRepository();
  const { repository: evidenceRepository } = createEvidenceRepository();
  const { repository: settingsRepository } = createSettingsRepository();
  const server = await startTestServer(
    createApp(
      reportRepository,
      assessmentRepository,
      companyRepository,
      threatRepository,
      evidenceRepository,
      settingsRepository,
    ),
  );

  try {
    const response = await fetch(`${server.baseUrl}/api/reports/not-an-id`);

    assert.equal(response.status, 400);
    assert.equal(findByIdCalls(), 0);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(
      body.error.details.some(detail => detail.path === 'id'),
      'Expected the invalid report ID to be reported',
    );
  } finally {
    await server.close();
  }
}

{
  const { repository: reportRepository } = createReportRepository({
    findById: async () => null,
  });
  const { findByIdCalls, repository: assessmentRepository } =
    createAssessmentRepository();
  const { repository: companyRepository } = createCompanyRepository();
  const { repository: threatRepository } = createThreatRepository();
  const { repository: evidenceRepository } = createEvidenceRepository();
  const { repository: settingsRepository } = createSettingsRepository();
  const server = await startTestServer(
    createApp(
      reportRepository,
      assessmentRepository,
      companyRepository,
      threatRepository,
      evidenceRepository,
      settingsRepository,
    ),
  );

  try {
    const response = await fetch(`${server.baseUrl}/api/reports/${report.id}`);

    assert.equal(response.status, 404);
    assert.equal(findByIdCalls(), 1);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'REPORT_NOT_FOUND',
        message: 'Report not found',
        details: [],
      },
    });
  } finally {
    await server.close();
  }
}

{
  const { repository: reportRepository } = createReportRepository({
    findById: async () => ({
      ...report,
      selectedThreatIds: [foreignThreat.id],
    }),
  });
  const { repository: assessmentRepository } = createAssessmentRepository();
  const { repository: companyRepository } = createCompanyRepository();
  const { repository: threatRepository } = createThreatRepository({
    findByAssessmentId: async () => [threatA, threatB],
  });
  const { repository: evidenceRepository } = createEvidenceRepository();
  const { repository: settingsRepository } = createSettingsRepository();
  const server = await startTestServer(
    createApp(
      reportRepository,
      assessmentRepository,
      companyRepository,
      threatRepository,
      evidenceRepository,
      settingsRepository,
    ),
  );

  try {
    const response = await fetch(`${server.baseUrl}/api/reports/${report.id}`);

    assert.equal(response.status, 400);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'REPORT_INVALID_RELATIONSHIP',
        message: 'Report contains invalid related records',
        details: [],
      },
    });
  } finally {
    await server.close();
  }
}

console.log('reports API route checks passed');

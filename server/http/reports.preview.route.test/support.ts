import { createServer } from 'node:http';

import { vi } from 'vitest';

import type { Assessment } from '../../../src/domain/assessment.js';
import type { Company } from '../../../src/domain/company.js';
import type { Evidence } from '../../../src/domain/evidence.js';
import type { ReportPreviewRequest } from '../../../src/domain/report-preview.js';
import type { Report } from '../../../src/domain/report.js';
import type { Settings } from '../../../src/domain/settings.js';
import type { Threat } from '../../../src/domain/threat.js';
import { loadServerConfig } from '../../config.js';
import { RepositoryError } from '../../database/errors.js';
import type { AssessmentRepository } from '../../database/repositories/assessment.repository.js';
import type { CompanyRepository } from '../../database/repositories/company.repository.js';
import type { EvidenceRepository } from '../../database/repositories/evidence.repository.js';
import type { ReportRepository } from '../../database/repositories/report.repository.js';
import type { SettingsRepository } from '../../database/repositories/settings.repository.js';
import type { ThreatRepository } from '../../database/repositories/threat.repository.js';
import { createApiApp } from '../api-app.js';

export const companyId = 'cmp_00000000-0000-0000-0000-000000000001';
export const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';
export const threatId = 'thr_00000000-0000-0000-0000-000000000001';
export const evidenceId = 'evd_00000000-0000-0000-0000-000000000001';
const timestamp = '2026-06-23T12:00:00.000Z';

export const company: Company = {
  id: companyId,
  name: 'Northstar Digital',
  description: 'Security consulting',
  website: 'https://northstar.example',
  contactName: 'Alex Mercer',
  contactEmail: 'security@northstar.example',
  logoUrl: 'logo_00000000-0000-0000-0000-000000000010',
  footerText: 'Client confidential',
  archivedAt: null,
  createdAt: timestamp,
  updatedAt: timestamp,
};

export const assessment: Assessment = {
  id: assessmentId,
  companyId,
  title: 'Customer Services Portal',
  status: 'in-progress',
  applicationName: 'Customer Services Portal',
  overallRisk: 'high',
  owaspTaxonomyVersion: '2025',
  createdAt: timestamp,
  updatedAt: timestamp,
};

export const threat: Threat = {
  id: threatId,
  assessmentId,
  title: 'Missing authorization',
  description: 'Object ownership is not enforced.',
  severity: 'critical',
  strideCategories: ['elevation-of-privilege'],
  status: 'open',
  recommendation: 'Apply object-level authorization.',
  evidenceCount: 1,
  createdAt: timestamp,
  updatedAt: timestamp,
};

export const evidence: Evidence = {
  id: evidenceId,
  assessmentId,
  threatIds: [threatId],
  type: 'note',
  title: 'Authorization evidence',
  content: 'Safe evidence content',
  fileName: 'evidence.txt',
  filePath: 'C:\\private\\evidence.txt',
  storageKey: 'private/evidence.txt',
  mimeType: 'text/plain',
  attachmentSizeBytes: 128,
  createdAt: timestamp,
  updatedAt: timestamp,
};

export const settings: Settings = {
  id: 'set_00000000-0000-0000-0000-000000000001',
  organisationName: 'AppSec Consulting Ltd',
  consultantName: 'Alex Mercer',
  consultantEmail: 'alex@example.com',
  issuerLogoId: 'logo_00000000-0000-0000-0000-000000000020',
  defaultSeverity: 'medium',
  theme: 'system',
  dateFormat: 'YYYY-MM-DD',
  reportFooterText: 'Confidential',
  reportConfidentialityLabel: 'Strictly confidential',
  confidentialReports: true,
  allowedBrandingModes: ['issuer', 'client'],
  defaultBrandingMode: 'issuer',
  createdAt: timestamp,
  updatedAt: timestamp,
};

export const previewRequest: ReportPreviewRequest = {
  companyId,
  assessmentId,
  selection: {
    threatIds: [threatId],
    evidenceIds: [evidenceId],
  },
  configuration: {
    methodology: 'OWASP ASVS / WSTG',
    reportStyle: 'Technical',
    includeEvidence: true,
  },
  brandingMode: 'issuer',
};

type Overrides = {
  company?: Company | null;
  assessment?: Assessment | null;
  threat?: Threat | null;
  evidence?: Evidence | null;
  settings?: Settings | null;
  companyError?: Error;
  settingsError?: Error;
};

const unusedReport: Report = {
  id: 'rpt_00000000-0000-0000-0000-000000000001',
  assessmentId,
  title: 'Unused',
  status: 'draft',
  selectedThreatIds: [],
  latestVersion: 0,
  createdAt: timestamp,
  updatedAt: timestamp,
};

export const createPreviewRepositories = (overrides: Overrides = {}) => {
  const companyFindById = vi.fn(async () => {
    if (overrides.companyError) throw overrides.companyError;
    return overrides.company === undefined ? company : overrides.company;
  });
  const assessmentFindById = vi.fn(async () =>
    overrides.assessment === undefined ? assessment : overrides.assessment,
  );
  const threatFindById = vi.fn(async () =>
    overrides.threat === undefined ? threat : overrides.threat,
  );
  const evidenceFindById = vi.fn(async () =>
    overrides.evidence === undefined ? evidence : overrides.evidence,
  );
  const settingsGet = vi.fn(async () => {
    if (overrides.settingsError) throw overrides.settingsError;
    return overrides.settings === undefined ? settings : overrides.settings;
  });

  const companyRepository = {
    findAll: vi.fn(async () => [company]),
    findById: companyFindById,
    findOverview: vi.fn(async () => null),
    create: vi.fn(async () => company),
    update: vi.fn(async () => company),
    updateLogoUrl: vi.fn(async () => company),
    delete: vi.fn(async () => undefined),
    archive: vi.fn(async () => company),
    restore: vi.fn(async () => company),
  } satisfies CompanyRepository;

  const assessmentRepository = {
    findAll: vi.fn(async () => [assessment]),
    findById: assessmentFindById,
    findByCompanyId: vi.fn(async () => [assessment]),
    create: vi.fn(async () => assessment),
    update: vi.fn(async () => assessment),
    delete: vi.fn(async () => undefined),
  } satisfies AssessmentRepository;

  const threatRepository = {
    findById: threatFindById,
    findByAssessmentId: vi.fn(async () => [threat]),
    create: vi.fn(async () => threat),
    update: vi.fn(async () => threat),
    delete: vi.fn(async () => undefined),
  } satisfies ThreatRepository;

  const evidenceRepository = {
    findById: evidenceFindById,
    findByAssessmentId: vi.fn(async () => [evidence]),
    create: vi.fn(async () => evidence),
    update: vi.fn(async () => evidence),
    delete: vi.fn(async () => undefined),
    attachToThreat: vi.fn(async () => undefined),
    detachFromThreat: vi.fn(async () => undefined),
  } satisfies EvidenceRepository;

  const settingsRepository = {
    get: settingsGet,
    upsert: vi.fn(async () => settings),
    updateIssuerLogoId: vi.fn(async () => settings),
  } satisfies SettingsRepository;

  const reportRepository = {
    findById: vi.fn(async () => unusedReport),
    findByAssessmentId: vi.fn(async () => [unusedReport]),
    create: vi.fn(async () => unusedReport),
    update: vi.fn(async () => unusedReport),
    delete: vi.fn(async () => undefined),
    attachThreat: vi.fn(async () => undefined),
    detachThreat: vi.fn(async () => undefined),
  } satisfies ReportRepository;

  return {
    repositories: {
      assessmentRepository,
      companyRepository,
      evidenceRepository,
      reportRepository,
      settingsRepository,
      threatRepository,
    },
    calls: {
      assessmentFindById,
      companyFindById,
      evidenceFindById,
      settingsGet,
      threatFindById,
    },
  };
};

const config = loadServerConfig({ FRONTEND_ORIGIN: 'http://localhost:5173' });

export const startPreviewServer = async (overrides: Overrides = {}) => {
  const created = createPreviewRepositories(overrides);
  const app = createApiApp(config, created.repositories);
  const server = createServer(app);

  await new Promise<void>(resolve => server.listen(0, resolve));
  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new RepositoryError('Expected an ephemeral test server port.');
  }

  return {
    ...created,
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: async () =>
      new Promise<void>((resolve, reject) => {
        server.close(error => (error ? reject(error) : resolve()));
      }),
  };
};

export const postPreview = (
  baseUrl: string,
  body: unknown = previewRequest,
): Promise<Response> =>
  fetch(`${baseUrl}/api/reports/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

import { OWASP_TOP_10_CURRENT_VERSION } from '../../../src/domain/owaspTop10.js';

import type { ActivityCreateInput } from './repository.helpers.js';
import type {
  RepositoryClient,
  RepositoryTransactionClient,
} from '../repository.types.js';
import { createActivityRepository } from './activity.repository.js';
import { createAssessmentRepository } from './assessment.repository.js';
import { createCompanyRepository } from './company.repository.js';
import { createEvidenceRepository } from './evidence.repository.js';
import { createReportRepository } from './report.repository.js';
import { createSettingsRepository } from './settings.repository.js';
import { createThreatRepository } from './threat.repository.js';

export type {
  ActivityCreateInput,
  RepositoryClient,
  RepositoryTransactionClient,
};

export {
  OWASP_TOP_10_CURRENT_VERSION,
  createActivityRepository,
  createAssessmentRepository,
  createCompanyRepository,
  createEvidenceRepository,
  createReportRepository,
  createSettingsRepository,
  createThreatRepository,
};

export const createdAt = new Date('2026-06-12T00:00:00.000Z');
export const updatedAt = new Date('2026-06-12T01:00:00.000Z');

export const companyRow = {
  id: 'cmp_123',
  name: 'Northstar Digital',
  description: null,
  website: null,
  contactName: 'Ada Lovelace',
  contactEmail: 'ada@example.com',
  logoUrl: null,
  footerText: null,
  createdAt,
  updatedAt,
};

export const assessmentRow = {
  id: 'asm_123',
  companyId: 'cmp_123',
  title: 'Assessment',
  description: null,
  scope: null,
  status: 'draft',
  startedAt: null,
  completedAt: null,
  applicationName: null,
  environment: null,
  assessmentType: null,
  overallRisk: null,
  owaspTaxonomyVersion: OWASP_TOP_10_CURRENT_VERSION,
  createdAt,
  updatedAt,
};

export const threatRow = {
  id: 'thr_123',
  assessmentId: 'asm_123',
  title: 'Threat',
  description: 'A test threat',
  severity: 'high',
  strideCategories: ['spoofing'],
  status: 'open',
  affectedAsset: null,
  impact: null,
  recommendation: null,
  observation: null,
  affectedComponent: null,
  affectedEndpoint: null,
  risk: null,
  createdAt,
  updatedAt,
};

export const evidenceRow = {
  id: 'evd_123',
  assessmentId: 'asm_123',
  threatLinks: [{ threatId: 'thr_123' }],
  httpExchanges: [],
  type: 'note',
  title: 'Evidence',
  description: null,
  content: null,
  fileName: null,
  filePath: null,
  storageKey: null,
  mimeType: null,
  attachmentSizeBytes: null,
  capturedAt: null,
  createdAt,
  updatedAt,
};

export const reportRow = {
  id: 'rpt_123',
  assessmentId: 'asm_123',
  selectedThreats: [{ threatId: 'thr_123' }],
  title: 'Report',
  status: 'draft',
  latestVersion: 1,
  executiveSummary: null,
  createdAt,
  updatedAt,
};

export const activityRow = {
  id: 'act_123',
  entityType: 'assessment',
  entityId: 'asm_123',
  action: 'created',
  message: 'Created assessment',
  createdAt,
};

export const settingsRow = {
  id: 'set_123',
  organisationName: 'Acme Ltd',
  consultantName: null,
  consultantEmail: null,
  issuerLogoId: 'logo_00000000-0000-0000-0000-000000000001',
  defaultReportTitle: null,
  defaultSeverity: 'medium',
  theme: 'system',
  dateFormat: 'YYYY-MM-DD',
  reportFooterText: null,
  reportConfidentialityLabel: 'Confidential',
  methodology: null,
  reportStyle: null,
  includeEvidence: null,
  confidentialReports: null,
  allowedBrandingModes: ['issuer', 'client'],
  defaultBrandingMode: 'issuer',
  createdAt,
  updatedAt,
};

export const createCompanyDb = () => {
  const calls: Array<{ method: string; args?: unknown }> = [];
  const company = {
    async findMany(args: unknown) {
      calls.push({ method: 'findMany', args });
      return [companyRow];
    },
    async findUnique(args: unknown) {
      calls.push({ method: 'findUnique', args });
      return null;
    },
    async create(args: unknown) {
      calls.push({ method: 'create', args });
      return companyRow;
    },
    async update(args: unknown) {
      calls.push({ method: 'update', args });
      return companyRow;
    },
    async delete(args: unknown) {
      calls.push({ method: 'delete', args });
      return undefined;
    },
  } as RepositoryClient['company'];

  const assessment = {
    async findMany(args: unknown) {
      calls.push({ method: 'assessment.findMany', args });
      return [];
    },
    async groupBy(args: unknown) {
      calls.push({ method: 'assessment.groupBy', args });
      return [];
    },
  } as unknown as RepositoryClient['assessment'];

  return {
    calls,
    db: { company, assessment },
  };
};

export const createAssessmentDb = () => {
  const calls: Array<{ method: string; args?: unknown }> = [];
  const assessment = {
    async findMany(args: unknown) {
      calls.push({ method: 'findMany', args });
      return [assessmentRow];
    },
    async findUnique(args: unknown) {
      calls.push({ method: 'findUnique', args });
      return assessmentRow;
    },
    async create(args: unknown) {
      calls.push({ method: 'create', args });
      return assessmentRow;
    },
    async update(args: unknown) {
      calls.push({ method: 'update', args });
      return assessmentRow;
    },
    async delete(args: unknown) {
      calls.push({ method: 'delete', args });
      return undefined;
    },
  } as RepositoryClient['assessment'];

  return {
    calls,
    db: { assessment },
  };
};

export const createThreatDb = (
  assessment = assessmentRow,
  row: typeof threatRow & {
    owaspCategoryCode?: string;
  } = threatRow as typeof threatRow & { owaspCategoryCode?: string },
) => {
  const calls: Array<{ method: string; args?: unknown }> = [];
  const threat = {
    async findUnique(args: unknown) {
      calls.push({ method: 'findUnique', args });
      return row;
    },
    async findMany(args: unknown) {
      calls.push({ method: 'findMany', args });
      return [row];
    },
    async create(args: unknown) {
      calls.push({ method: 'create', args });
      return row;
    },
    async update(args: unknown) {
      calls.push({ method: 'update', args });
      return row;
    },
    async delete(args: unknown) {
      calls.push({ method: 'delete', args });
      return undefined;
    },
  } as RepositoryClient['threat'];

  const assessmentDb = {
    async findUnique(args: unknown) {
      calls.push({ method: 'assessment.findUnique', args });
      return assessment;
    },
  } as RepositoryClient['assessment'];

  return {
    calls,
    db: { threat, assessment: assessmentDb },
  };
};

export const createActivityDb = () => {
  const calls: Array<{ method: string; args?: unknown }> = [];
  const activity = {
    async findUnique(args: unknown) {
      calls.push({ method: 'findUnique', args });
      return activityRow;
    },
    async findMany(args: unknown) {
      calls.push({ method: 'findMany', args });
      return [activityRow];
    },
    async create(args: unknown) {
      calls.push({ method: 'create', args });
      return activityRow;
    },
  } as RepositoryClient['activity'];

  return {
    calls,
    db: { activity },
  };
};

export const createSettingsDb = () => {
  const calls: Array<{ method: string; args?: unknown }> = [];
  const settings = {
    async findFirst(args: unknown) {
      calls.push({ method: 'findFirst', args });
      return null;
    },
    async create(args: unknown) {
      calls.push({ method: 'create', args });
      return settingsRow;
    },
    async update(args: unknown) {
      calls.push({ method: 'update', args });
      return settingsRow;
    },
  } as RepositoryClient['settings'];

  return {
    calls,
    db: { settings },
  };
};

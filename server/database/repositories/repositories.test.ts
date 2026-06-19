import assert from 'node:assert/strict';

import type { ActivityCreateInput } from './repository.helpers.js';
import type {
  RepositoryClient,
  RepositoryTransactionClient,
} from '../repository.types.js';
import { OWASP_TOP_10_CURRENT_VERSION } from '../../../src/domain/owaspTop10.js';
import { createActivityRepository } from './activity.repository.js';
import { createAssessmentRepository } from './assessment.repository.js';
import { createCompanyRepository } from './company.repository.js';
import { createEvidenceRepository } from './evidence.repository.js';
import { createReportRepository } from './report.repository.js';
import { createSettingsRepository } from './settings.repository.js';
import { createThreatRepository } from './threat.repository.js';

const createdAt = new Date('2026-06-12T00:00:00.000Z');
const updatedAt = new Date('2026-06-12T01:00:00.000Z');

const companyRow = {
  id: 'cmp_123',
  name: 'Northstar Digital',
  description: null,
  website: null,
  contactName: 'Ada Lovelace',
  contactEmail: 'ada@example.com',
  logoPath: null,
  footerText: null,
  createdAt,
  updatedAt,
};

const assessmentRow = {
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

const threatRow = {
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

const evidenceRow = {
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

const reportRow = {
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

const activityRow = {
  id: 'act_123',
  entityType: 'assessment',
  entityId: 'asm_123',
  action: 'created',
  message: 'Created assessment',
  createdAt,
};

const settingsRow = {
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

const createCompanyDb = () => {
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

const createAssessmentDb = () => {
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

const createThreatDb = (
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

const createEvidenceDb = (row = evidenceRow) => {
  const calls: Array<{ method: string; args?: unknown }> = [];
  const transactionDb: RepositoryTransactionClient = {
    evidence: {
      async findUnique(args: unknown) {
        calls.push({ method: 'evidence.findUnique', args });
        return row;
      },
      async findMany(args: unknown) {
        calls.push({ method: 'evidence.findMany', args });
        return [row];
      },
      async create(args: unknown) {
        calls.push({ method: 'evidence.create', args });
        return row;
      },
      async update(args: unknown) {
        calls.push({ method: 'evidence.update', args });
        return row;
      },
      async delete(args: unknown) {
        calls.push({ method: 'evidence.delete', args });
        return row;
      },
    } as RepositoryTransactionClient['evidence'],
    evidenceThreat: {
      async deleteMany(args: unknown) {
        calls.push({ method: 'evidenceThreat.deleteMany', args });
        return { count: 1 };
      },
      async createMany(args: unknown) {
        calls.push({ method: 'evidenceThreat.createMany', args });
        return { count: 1 };
      },
      async create(args: unknown) {
        calls.push({ method: 'evidenceThreat.create', args });
        return { evidenceId: 'evd_123', threatId: 'thr_123' };
      },
      async delete(args: unknown) {
        calls.push({ method: 'evidenceThreat.delete', args });
        return { evidenceId: 'evd_123', threatId: 'thr_123' };
      },
    } as RepositoryTransactionClient['evidenceThreat'],
    evidenceExchange: {
      async deleteMany(args: unknown) {
        calls.push({ method: 'evidenceExchange.deleteMany', args });
        return { count: 1 };
      },
      async createMany(args: unknown) {
        calls.push({ method: 'evidenceExchange.createMany', args });
        return { count: 1 };
      },
      async create(args: unknown) {
        calls.push({ method: 'evidenceExchange.create', args });
        return {
          id: 'evx_123',
          evidenceId: 'evd_123',
          position: 0,
          request: {},
          response: {},
        };
      },
      async delete(args: unknown) {
        calls.push({ method: 'evidenceExchange.delete', args });
        return {
          id: 'evx_123',
          evidenceId: 'evd_123',
          position: 0,
          request: {},
          response: {},
        };
      },
    } as RepositoryTransactionClient['evidenceExchange'],
    report: {} as RepositoryTransactionClient['report'],
    reportThreat: {} as RepositoryTransactionClient['reportThreat'],
    activity: {} as RepositoryTransactionClient['activity'],
    company: {} as RepositoryTransactionClient['company'],
    assessment: {} as RepositoryTransactionClient['assessment'],
    threat: {} as RepositoryTransactionClient['threat'],
    settings: {} as RepositoryTransactionClient['settings'],
  };

  const db = {
    ...transactionDb,
    async $transaction<T>(fn: (tx: RepositoryTransactionClient) => Promise<T>) {
      return fn(transactionDb);
    },
  } as Pick<
    RepositoryClient,
    'evidence' | 'evidenceExchange' | 'evidenceThreat' | '$transaction'
  >;

  return {
    calls,
    db,
  };
};

const createReportDb = () => {
  const calls: Array<{ method: string; args?: unknown }> = [];
  const transactionDb: RepositoryTransactionClient = {
    report: {
      async findUnique(args: unknown) {
        calls.push({ method: 'report.findUnique', args });
        return reportRow;
      },
      async findMany(args: unknown) {
        calls.push({ method: 'report.findMany', args });
        return [reportRow];
      },
      async create(args: unknown) {
        calls.push({ method: 'report.create', args });
        return reportRow;
      },
      async update(args: unknown) {
        calls.push({ method: 'report.update', args });
        return reportRow;
      },
      async delete(args: unknown) {
        calls.push({ method: 'report.delete', args });
        return reportRow;
      },
    } as RepositoryTransactionClient['report'],
    reportThreat: {
      async deleteMany(args: unknown) {
        calls.push({ method: 'reportThreat.deleteMany', args });
        return { count: 1 };
      },
      async createMany(args: unknown) {
        calls.push({ method: 'reportThreat.createMany', args });
        return { count: 1 };
      },
      async create(args: unknown) {
        calls.push({ method: 'reportThreat.create', args });
        return { reportId: 'rpt_123', threatId: 'thr_123' };
      },
      async delete(args: unknown) {
        calls.push({ method: 'reportThreat.delete', args });
        return { reportId: 'rpt_123', threatId: 'thr_123' };
      },
    } as RepositoryTransactionClient['reportThreat'],
    evidenceExchange: {} as RepositoryTransactionClient['evidenceExchange'],
    evidence: {} as RepositoryTransactionClient['evidence'],
    evidenceThreat: {} as RepositoryTransactionClient['evidenceThreat'],
    activity: {} as RepositoryTransactionClient['activity'],
    company: {} as RepositoryTransactionClient['company'],
    assessment: {} as RepositoryTransactionClient['assessment'],
    threat: {} as RepositoryTransactionClient['threat'],
    settings: {} as RepositoryTransactionClient['settings'],
  };

  const db = {
    ...transactionDb,
    async $transaction<T>(fn: (tx: RepositoryTransactionClient) => Promise<T>) {
      return fn(transactionDb);
    },
  } as Pick<RepositoryClient, 'report' | 'reportThreat' | '$transaction'>;

  return {
    calls,
    db,
  };
};

const createActivityDb = () => {
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

const createSettingsDb = () => {
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

{
  const { calls, db } = createCompanyDb();
  const repository = createCompanyRepository(db);
  const companies = await repository.findAll();
  const missingCompany = await repository.findById('cmp_missing');

  assert.equal(companies[0].id, companyRow.id);
  assert.equal(calls[0]?.method, 'findMany');
  assert.equal(missingCompany, null);
}

{
  const { calls, db } = createAssessmentDb();
  const repository = createAssessmentRepository(db);
  const assessments = await repository.findByCompanyId('cmp_123');

  assert.equal(assessments[0].id, assessmentRow.id);
  assert.equal(calls[0]?.method, 'findMany');
}

{
  const { calls, db } = createAssessmentDb();
  const repository = createAssessmentRepository(db);
  const createdAssessment = await repository.create({
    companyId: 'cmp_123',
    title: 'Assessment',
    description: undefined,
    scope: undefined,
    status: 'draft',
    startedAt: undefined,
    completedAt: undefined,
    applicationName: undefined,
    environment: undefined,
    assessmentType: undefined,
    overallRisk: undefined,
  });

  assert.equal(createdAssessment.owaspTaxonomyVersion, '2025');
  const createArgs = calls.find(call => call.method === 'create')?.args as {
    data?: { owaspTaxonomyVersion?: string };
  };
  assert.equal(createArgs?.data?.owaspTaxonomyVersion, '2025');
}

{
  const { calls, db } = createThreatDb();
  const repository = createThreatRepository(db);
  const threats = await repository.findByAssessmentId('asm_123');

  assert.equal(threats[0].id, threatRow.id);
  assert.equal(calls[0]?.method, 'findMany');
}

{
  const { calls, db } = createThreatDb();
  const repository = createThreatRepository(db);
  const createdThreat = await repository.create({
    assessmentId: assessmentRow.id,
    title: 'Threat',
    description: 'A test threat',
    severity: 'high',
    strideCategories: ['spoofing'],
    status: 'open',
    owaspCategoryCode: 'A09:2025',
    affectedAsset: undefined,
    impact: undefined,
    recommendation: undefined,
    remediation: undefined,
    observation: undefined,
    reproductionSteps: undefined,
    affectedComponent: undefined,
    affectedEndpoint: undefined,
    risk: undefined,
    references: undefined,
  });

  assert.equal(createdThreat.id, threatRow.id);
  assert.equal(calls[0]?.method, 'assessment.findUnique');
  assert.equal(calls[1]?.method, 'create');
}

{
  const { calls, db } = createThreatDb({
    ...assessmentRow,
    owaspTaxonomyVersion: OWASP_TOP_10_CURRENT_VERSION,
  });
  const repository = createThreatRepository(db);

  await assert.rejects(
    repository.create({
      assessmentId: assessmentRow.id,
      title: 'Threat',
      description: 'A test threat',
      severity: 'high',
      strideCategories: ['spoofing'],
      status: 'open',
      owaspCategoryCode: 'A09:2021',
      affectedAsset: undefined,
      impact: undefined,
      recommendation: undefined,
      remediation: undefined,
      observation: undefined,
      reproductionSteps: undefined,
      affectedComponent: undefined,
      affectedEndpoint: undefined,
      risk: undefined,
      references: undefined,
    }),
    error => error instanceof Error && error.name === 'ValidationError',
  );

  assert.equal(calls[0]?.method, 'assessment.findUnique');
  assert.equal(
    calls.some(call => call.method === 'create'),
    false,
  );
}

{
  const { calls, db } = createThreatDb();
  const repository = createThreatRepository(db);

  await assert.rejects(
    repository.update('thr_123', {
      title: 'Threat',
      status: 'open',
      owaspCategoryCode: 'A09:2025',
    }),
    error => error instanceof Error && error.name === 'ValidationError',
  );

  assert.equal(calls[0]?.method, 'findUnique');
  assert.equal(calls[1]?.method, 'assessment.findUnique');
  assert.equal(
    calls.some(call => call.method === 'update'),
    false,
  );
}

{
  const { calls, db } = createThreatDb(assessmentRow, {
    ...threatRow,
    owaspCategoryCode: 'A09:2025',
  });
  const repository = createThreatRepository(db);

  await assert.rejects(
    repository.update('thr_123', {
      title: 'Threat',
      status: 'open',
    }),
    error => error instanceof Error && error.name === 'ValidationError',
  );

  assert.equal(calls[0]?.method, 'findUnique');
  assert.equal(calls[1]?.method, 'assessment.findUnique');
  assert.equal(
    calls.some(call => call.method === 'update'),
    false,
  );
}

{
  const { calls, db } = createEvidenceDb();
  const repository = createEvidenceRepository(db);
  const evidence = await repository.create({
    assessmentId: 'asm_123',
    threatIds: ['thr_123', 'thr_123'],
    type: 'http',
    title: 'Evidence',
    description: undefined,
    content: undefined,
    fileName: undefined,
    filePath: undefined,
    storageKey: undefined,
    mimeType: undefined,
    attachmentSizeBytes: undefined,
    capturedAt: undefined,
    httpExchanges: [
      {
        request: {
          method: 'GET',
          url: '/api/orders/1',
        },
        response: {
          statusCode: 200,
        },
      },
      {
        request: {
          method: 'POST',
          url: '/api/orders/1',
        },
        response: {
          statusCode: 201,
        },
      },
    ],
  });

  assert.equal(evidence.id, evidenceRow.id);
  assert.equal(calls[0]?.method, 'evidence.create');
  assert.equal(calls[1]?.method, 'evidenceExchange.deleteMany');
  assert.equal(calls[2]?.method, 'evidenceExchange.createMany');
  const createArgs = calls[0]?.args as {
    data?: { threatLinks?: { create?: Array<{ threatId: string }> } };
  };
  assert.equal(createArgs?.data?.threatLinks?.create?.length, 1);
  const exchangeArgs = calls[2]?.args as {
    data?: Array<{ position: number }>;
  };
  assert.equal(exchangeArgs?.data?.length, 2);

  const detached = await repository.detachFromThreat('evd_123', 'thr_123');
  assert.equal(detached, undefined);
  assert.equal(calls.at(-1)?.method, 'evidenceThreat.delete');
}

{
  const { calls, db } = createEvidenceDb();
  const repository = createEvidenceRepository(db);
  const evidence = await repository.update('evd_123', {
    assessmentId: 'asm_123',
    threatIds: ['thr_123'],
    type: 'note',
    title: 'Evidence',
    description: undefined,
    content: undefined,
    fileName: undefined,
    filePath: undefined,
    storageKey: undefined,
    mimeType: undefined,
    attachmentSizeBytes: undefined,
    capturedAt: undefined,
    httpExchanges: [],
  });

  assert.equal(evidence.type, 'note');
  assert.equal(
    calls.some(call => call.method === 'evidenceExchange.deleteMany'),
    true,
  );
  assert.equal(
    calls.some(call => call.method === 'evidenceExchange.createMany'),
    false,
  );
}

{
  const nonHttpEvidenceRow = {
    ...evidenceRow,
    type: 'text',
    httpExchanges: [
      {
        position: 0,
        request: {},
        response: {},
      },
    ],
  };
  const calls: Array<{ method: string; args?: unknown }> = [];
  const transactionDb: RepositoryTransactionClient = {
    evidence: {
      async findUnique(args: unknown) {
        calls.push({ method: 'evidence.findUnique', args });
        return nonHttpEvidenceRow;
      },
      async findMany() {
        return [nonHttpEvidenceRow];
      },
      async create() {
        return nonHttpEvidenceRow;
      },
      async update() {
        return nonHttpEvidenceRow;
      },
      async delete() {
        return nonHttpEvidenceRow;
      },
    } as RepositoryTransactionClient['evidence'],
    evidenceThreat: {} as RepositoryTransactionClient['evidenceThreat'],
    evidenceExchange: {} as RepositoryTransactionClient['evidenceExchange'],
    report: {} as RepositoryTransactionClient['report'],
    reportThreat: {} as RepositoryTransactionClient['reportThreat'],
    activity: {} as RepositoryTransactionClient['activity'],
    company: {} as RepositoryTransactionClient['company'],
    assessment: {} as RepositoryTransactionClient['assessment'],
    threat: {} as RepositoryTransactionClient['threat'],
    settings: {} as RepositoryTransactionClient['settings'],
  };
  const db = {
    ...transactionDb,
    async $transaction<T>(fn: (tx: RepositoryTransactionClient) => Promise<T>) {
      return fn(transactionDb);
    },
  } as Pick<
    RepositoryClient,
    'evidence' | 'evidenceExchange' | 'evidenceThreat' | '$transaction'
  >;
  const repository = createEvidenceRepository(db);
  const evidence = await repository.findById('evd_123');

  assert.equal(evidence?.type, 'text');
  assert.deepEqual(evidence?.httpExchanges, []);
  assert.equal(calls[0]?.method, 'evidence.findUnique');
}

{
  const { calls, db } = createReportDb();
  const repository = createReportRepository(db);
  const report = await repository.create({
    assessmentId: 'asm_123',
    title: 'Report',
    status: 'draft',
    latestVersion: 1,
    executiveSummary: undefined,
    selectedThreatIds: ['thr_123', 'thr_123'],
  });

  assert.equal(report.id, reportRow.id);
  const createArgs = calls.find(call => call.method === 'report.create')
    ?.args as {
    data?: { selectedThreats?: { create?: Array<{ threatId: string }> } };
  };
  assert.equal(createArgs?.data?.selectedThreats?.create?.length, 1);

  await repository.attachThreat('rpt_123', 'thr_123');
  assert.equal(calls.at(-1)?.method, 'reportThreat.create');
}

{
  const { calls, db } = createActivityDb();
  const repository = createActivityRepository(db);
  const activity = await repository.create({
    entityType: 'assessment',
    entityId: 'asm_123',
    action: 'created',
    message: 'Created assessment',
  } satisfies ActivityCreateInput);

  assert.equal(activity.id.startsWith('act_'), true);
  assert.equal(calls[0]?.method, 'create');
  const recent = await repository.findRecent(500);
  assert.equal(recent.length, 1);
  assert.equal(calls.at(-1)?.method, 'findMany');
  const recentArgs = calls.at(-1)?.args as { take?: number } | undefined;
  assert.equal(recentArgs?.take, 100);
}

{
  const { calls, db } = createSettingsDb();
  const repository = createSettingsRepository(db);
  const missingSettings = await repository.get();
  const settings = await repository.upsert({
    defaultSeverity: 'medium',
    theme: 'system',
    dateFormat: 'YYYY-MM-DD',
    organisationName: 'Acme Ltd',
    issuerLogoId: 'logo_00000000-0000-0000-0000-000000000001',
    reportConfidentialityLabel: 'Confidential',
    allowedBrandingModes: ['issuer', 'client'],
    defaultBrandingMode: 'issuer',
  });

  assert.equal(missingSettings, null);
  assert.equal(settings.id, settingsRow.id);
  assert.equal(settings.issuerLogoId, settingsRow.issuerLogoId);
  assert.deepEqual(settings.allowedBrandingModes, ['issuer', 'client']);
  assert.equal(settings.defaultBrandingMode, 'issuer');
  assert.equal(calls[0]?.method, 'findFirst');
  assert.equal(calls[1]?.method, 'findFirst');
  assert.equal(calls[2]?.method, 'create');
}

console.log('repository unit checks passed');

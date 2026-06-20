import assert from 'node:assert/strict';

import {
  ActivityCreateInput,
  RepositoryClient,
  RepositoryTransactionClient,
  createActivityDb,
  createActivityRepository,
  createEvidenceRepository,
  createReportRepository,
  createSettingsDb,
  createSettingsRepository,
  createThreatDb,
  createThreatRepository,
  evidenceRow,
  reportRow,
  settingsRow,
} from './repositories.test.support.js';

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
  const { calls, db } = createThreatDb(undefined, {
    id: 'thr_123',
    assessmentId: 'asm_123',
    title: 'Threat',
    description: 'A test threat',
    severity: 'high',
    strideCategories: ['spoofing'],
    status: 'open',
    owaspCategoryCode: 'A09:2025',
    affectedAsset: null,
    impact: null,
    recommendation: null,
    observation: null,
    affectedComponent: null,
    affectedEndpoint: null,
    risk: null,
    createdAt: new Date('2026-06-12T00:00:00.000Z'),
    updatedAt: new Date('2026-06-12T01:00:00.000Z'),
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
        request: { method: 'GET', url: '/api/orders/1' },
        response: { statusCode: 200 },
      },
      {
        request: { method: 'POST', url: '/api/orders/1' },
        response: { statusCode: 201 },
      },
    ],
  });

  assert.equal(evidence.id, evidenceRow.id);
  assert.equal(calls[0]?.method, 'evidence.create');
  assert.equal(calls[1]?.method, 'evidenceExchange.deleteMany');
  assert.equal(calls[2]?.method, 'evidenceExchange.createMany');
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
  assert.equal(calls[0]?.method, 'findFirst');
}

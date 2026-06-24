import assert from 'node:assert/strict';

import { ValidationError } from '../../../src/validation/index.js';
import {
  createReportVersionRepository,
  createReportVersionDb,
  reportVersionRow,
} from './repositories.test.support.js';

const validSnapshot = {
  reportTitle: 'Security Report',
  companyName: 'Northstar Digital',
  assessmentTitle: 'API review',
  branding: { clientName: 'Northstar Digital' },
  threats: [],
};

const validInput = {
  reportId: 'rpt_123',
  version: 1,
  status: 'draft' as const,
  generatedAt: '2026-06-21',
  filePath: undefined,
  snapshot: validSnapshot,
};

// create calls the db and returns the mapped domain object
{
  const { calls, db } = createReportVersionDb();
  const repository = createReportVersionRepository(db);
  const version = await repository.create(validInput);

  assert.equal(version.id, reportVersionRow.id);
  assert.equal(version.reportId, reportVersionRow.reportId);
  assert.equal(version.version, 1);
  assert.equal(version.status, 'draft');
  assert.equal(version.generatedAt, '2026-06-21');
  assert.equal(version.filePath, undefined);
  assert.deepEqual(version.snapshot, validSnapshot);
  assert.equal(calls[0]?.method, 'reportVersion.create');
}

// create with final status
{
  const { calls, db } = createReportVersionDb({
    ...reportVersionRow,
    status: 'final',
  });
  const repository = createReportVersionRepository(db);
  const version = await repository.create({ ...validInput, status: 'final' });

  assert.equal(version.status, 'final');
  assert.equal(calls[0]?.method, 'reportVersion.create');
}

// create rejects invalid snapshot (missing required fields)
{
  const { db } = createReportVersionDb();
  const repository = createReportVersionRepository(db);

  await assert.rejects(
    repository.create({
      ...validInput,
      snapshot: { reportTitle: 'Missing required fields' } as never,
    }),
    error => error instanceof ValidationError,
  );
}

// create rejects snapshot with unknown fields
{
  const { db } = createReportVersionDb();
  const repository = createReportVersionRepository(db);

  await assert.rejects(
    repository.create({
      ...validInput,
      snapshot: {
        ...validSnapshot,
        unknownField: 'not allowed',
      } as never,
    }),
    error => error instanceof ValidationError,
  );
}

// findById returns mapped domain object when found
{
  const { calls, db } = createReportVersionDb();
  const repository = createReportVersionRepository(db);
  const version = await repository.findById(
    'rvs_00000000-0000-0000-0000-000000000001',
  );

  assert.ok(version !== null);
  assert.equal(version?.id, reportVersionRow.id);
  assert.equal(calls[0]?.method, 'reportVersion.findUnique');
}

// findById returns null when not found
{
  const calls: Array<{ method: string; args?: unknown }> = [];
  const reportVersion = {
    async findUnique(args: unknown) {
      calls.push({ method: 'reportVersion.findUnique', args });
      return null;
    },
  } as never;
  const db = {
    reportVersion,
    async $transaction<T>(
      operation: (transaction: {
        reportVersion: typeof reportVersion;
      }) => Promise<T>,
    ) {
      return operation({ reportVersion });
    },
  };
  const repository = createReportVersionRepository(db);
  const version = await repository.findById(
    'rvs_00000000-0000-0000-0000-000000000099',
  );

  assert.equal(version, null);
  assert.equal(calls[0]?.method, 'reportVersion.findUnique');
}

// findByReportId returns list of mapped domain objects
{
  const { calls, db } = createReportVersionDb();
  const repository = createReportVersionRepository(db);
  const versions = await repository.findByReportId('rpt_123');

  assert.equal(versions.length, 1);
  assert.equal(versions[0]?.id, reportVersionRow.id);
  assert.equal(calls[0]?.method, 'reportVersion.findMany');
}

// withTransaction binds all operations to the same transaction client
{
  const { calls, db } = createReportVersionDb();
  const repository = createReportVersionRepository(db);

  const result = await repository.withTransaction(
    async transactionRepository => {
      assert.equal('withTransaction' in transactionRepository, false);
      return transactionRepository.findByReportId('rpt_123');
    },
  );

  assert.equal(result.length, 1);
  assert.equal(calls[0]?.method, '$transaction');
  assert.equal(calls[1]?.method, 'reportVersion.findMany');
}

// withTransaction preserves application errors raised by its operation
{
  const { db } = createReportVersionDb();
  const repository = createReportVersionRepository(db);
  const failure = new Error('numbering failed');

  await assert.rejects(
    repository.withTransaction(async () => {
      throw failure;
    }),
    error => error === failure,
  );
}

// no update or delete methods exist on the repository interface
{
  const { db } = createReportVersionDb();
  const repository = createReportVersionRepository(db);

  assert.equal(
    'update' in repository,
    false,
    'ReportVersionRepository must not expose an update method',
  );
  assert.equal(
    'delete' in repository,
    false,
    'ReportVersionRepository must not expose a delete method',
  );
}

console.log('report version repository checks passed');

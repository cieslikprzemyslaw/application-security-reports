import assert from 'node:assert/strict';

import type { UpdateCompanyInput } from '../../../src/domain/company.js';
import { RepositoryConstraintError, RepositoryError } from '../errors.js';
import type { RepositoryClient } from '../repository.types.js';
import { createCompanyRepository } from './company.repository.js';

const createdAt = new Date('2026-06-21T10:00:00.000Z');
const updatedAt = new Date('2026-06-21T11:00:00.000Z');

type CompanyRow = {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  contactName: string | null;
  contactEmail: string | null;
  logoUrl: string | null;
  footerText: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const baseCompanyRow: CompanyRow = {
  id: 'cmp_00000000-0000-0000-0000-000000000001',
  name: 'Northstar Digital',
  description: 'Security consulting',
  website: 'https://northstar.example',
  contactName: 'Ada Lovelace',
  contactEmail: 'ada@example.com',
  logoUrl: null,
  footerText: 'Confidential',
  archivedAt: null,
  createdAt,
  updatedAt,
};

type RepositoryCall = {
  method: string;
  args?: unknown;
};

type WriteMethod = 'create' | 'update' | 'delete';

const cloneRow = (row: CompanyRow | null): CompanyRow | null =>
  row
    ? {
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
        archivedAt: row.archivedAt ? new Date(row.archivedAt) : null,
      }
    : null;

const createHarness = (initialRow: CompanyRow | null = baseCompanyRow) => {
  const calls: RepositoryCall[] = [];
  let stored = cloneRow(initialRow);
  let failedWrite: WriteMethod | null = null;
  let deleteError: Error | null = null;

  const company = {
    async findMany(args: unknown) {
      calls.push({ method: 'company.findMany', args });
      return stored ? [stored] : [];
    },

    async findUnique(args: unknown) {
      calls.push({ method: 'company.findUnique', args });

      const id = (args as { where: { id: string } }).where.id;

      return stored?.id === id ? stored : null;
    },

    async create(args: unknown) {
      calls.push({ method: 'company.create', args });

      if (failedWrite === 'create') {
        throw new Error('Simulated create failure');
      }

      const data = (args as { data: Record<string, unknown> }).data;

      stored = {
        id: String(data.id),
        name: String(data.name),
        description:
          typeof data.description === 'string' ? data.description : null,
        website: typeof data.website === 'string' ? data.website : null,
        contactName:
          typeof data.contactName === 'string' ? data.contactName : null,
        contactEmail:
          typeof data.contactEmail === 'string' ? data.contactEmail : null,
        logoUrl: null,
        footerText:
          typeof data.footerText === 'string' ? data.footerText : null,
        archivedAt: null,
        createdAt,
        updatedAt,
      };

      return stored;
    },

    async update(args: unknown) {
      calls.push({ method: 'company.update', args });

      if (failedWrite === 'update') {
        throw new Error('Simulated update failure');
      }

      if (!stored) {
        throw new Error('Company does not exist');
      }

      const data = (args as { data: Partial<CompanyRow> }).data;

      stored = {
        ...stored,
        ...data,
        updatedAt,
      };

      return stored;
    },

    async delete(args: unknown) {
      calls.push({ method: 'company.delete', args });

      if (deleteError) {
        throw deleteError;
      }

      if (failedWrite === 'delete') {
        throw new Error('Simulated delete failure');
      }

      stored = null;
    },
  } as unknown as RepositoryClient['company'];

  const assessment = {
    async groupBy(args: unknown) {
      calls.push({ method: 'assessment.groupBy', args });

      return [
        { status: 'draft', _count: { _all: 1 } },
        { status: 'in-progress', _count: { _all: 2 } },
        { status: 'completed', _count: { _all: 3 } },
      ];
    },

    async findMany(args: unknown) {
      calls.push({ method: 'assessment.findMany', args });

      return [
        {
          id: 'asm_00000000-0000-0000-0000-000000000001',
          applicationName: 'Customer Portal',
          assessmentType: 'Web App',
          overallRisk: 'high',
          status: 'in-progress',
          _count: { threats: 4 },
        },
      ];
    },
  } as unknown as RepositoryClient['assessment'];

  return {
    calls,
    db: { company, assessment },
    snapshot: () => cloneRow(stored),
    failNextWrite: (method: WriteMethod) => {
      failedWrite = method;
    },
    setDeleteError: (error: Error | null) => {
      deleteError = error;
    },
  };
};

{
  const harness = createHarness();
  const repository = createCompanyRepository(harness.db);

  const companies = await repository.findAll();
  const existing = await repository.findById(baseCompanyRow.id);
  const missing = await repository.findById('cmp_missing');

  assert.equal(companies.length, 1);
  assert.equal(existing?.id, baseCompanyRow.id);
  assert.equal(missing, null);

  const findAllCall = harness.calls.find(
    call => call.method === 'company.findMany',
  );

  assert.deepEqual(
    (findAllCall?.args as { where?: unknown }).where,
    { archivedAt: null },
    'Company lists should exclude archived records',
  );
  assert.deepEqual(
    (findAllCall?.args as { orderBy?: unknown }).orderBy,
    { name: 'asc' },
    'Company lists should use stable alphabetical ordering',
  );
}

{
  const harness = createHarness();
  const repository = createCompanyRepository(harness.db);

  const overview = await repository.findOverview(baseCompanyRow.id);

  assert.ok(overview);
  assert.deepEqual(overview.assessmentCounts, {
    total: 6,
    draft: 1,
    inProgress: 2,
    completed: 3,
  });
  assert.equal(overview.recentAssessments.length, 1);
  assert.equal(overview.recentAssessments[0]?.companyName, baseCompanyRow.name);
  assert.equal(overview.recentAssessments[0]?.findingsCount, 4);

  const groupedCall = harness.calls.find(
    call => call.method === 'assessment.groupBy',
  );
  const recentCall = harness.calls.find(
    call => call.method === 'assessment.findMany',
  );

  assert.deepEqual((groupedCall?.args as { where?: unknown }).where, {
    companyId: baseCompanyRow.id,
  });
  assert.equal((recentCall?.args as { take?: number }).take, 5);
}

{
  const harness = createHarness(null);
  const repository = createCompanyRepository(harness.db);

  const created = await repository.create({
    name: 'Example Security',
    description: 'Testing services',
    website: 'https://example.test',
    contactName: 'Grace Hopper',
    contactEmail: 'grace@example.test',
    footerText: 'Private',
  });

  assert.ok(created.id.startsWith('cmp_'));

  const createCall = harness.calls.find(
    call => call.method === 'company.create',
  );
  const data = (createCall?.args as { data: Record<string, unknown> }).data;

  assert.ok(String(data.id).startsWith('cmp_'));
  assert.deepEqual(
    Object.keys(data).sort(),
    [
      'contactEmail',
      'contactName',
      'description',
      'footerText',
      'id',
      'name',
      'website',
    ].sort(),
    'Create should send only repository-owned and mutable Company fields',
  );
  assert.equal('logoUrl' in data, false);
  assert.equal('archivedAt' in data, false);
}

{
  const harness = createHarness();
  const repository = createCompanyRepository(harness.db);

  const inputWithUnsupportedFields = {
    name: 'Northstar Security',
    footerText: 'Internal use only',
    id: 'cmp_attacker_controlled',
    logoUrl: 'https://attacker.example/logo.png',
    archivedAt: '2026-06-21T12:00:00.000Z',
    createdAt: '2026-06-21T12:00:00.000Z',
    updatedAt: '2026-06-21T12:00:00.000Z',
  } as unknown as UpdateCompanyInput;

  const updated = await repository.update(
    baseCompanyRow.id,
    inputWithUnsupportedFields,
  );

  assert.equal(updated.name, 'Northstar Security');
  assert.equal(updated.footerText, 'Internal use only');

  const updateCall = harness.calls.find(
    call => call.method === 'company.update',
  );
  const data = (updateCall?.args as { data: Record<string, unknown> }).data;

  assert.deepEqual(
    Object.keys(data).sort(),
    ['footerText', 'name'],
    'Update should enforce the repository allowlist',
  );
}

{
  const harness = createHarness();
  const repository = createCompanyRepository(harness.db);

  const updated = await repository.updateLogoUrl(
    baseCompanyRow.id,
    'https://northstar.example/logo.png',
  );

  assert.equal(updated.logoUrl, 'https://northstar.example/logo.png');

  const updateCall = harness.calls.find(
    call =>
      call.method === 'company.update' &&
      Object.prototype.hasOwnProperty.call(
        (call.args as { data: object }).data,
        'logoUrl',
      ),
  );

  assert.deepEqual(
    (updateCall?.args as { data: unknown }).data,
    { logoUrl: 'https://northstar.example/logo.png' },
    'Logo updates should use the dedicated repository method',
  );
}

{
  const harness = createHarness();
  const repository = createCompanyRepository(harness.db);
  const before = harness.snapshot();

  harness.failNextWrite('update');

  await assert.rejects(
    repository.update(baseCompanyRow.id, {
      name: 'This must not persist',
    }),
    error => error instanceof RepositoryError,
  );

  assert.deepEqual(
    harness.snapshot(),
    before,
    'A failed update must leave persisted state unchanged',
  );
}

{
  const harness = createHarness();
  const repository = createCompanyRepository(harness.db);
  const before = harness.snapshot();
  const relationshipError = new RepositoryConstraintError();

  harness.setDeleteError(relationshipError);

  await assert.rejects(
    repository.delete(baseCompanyRow.id),
    error => error === relationshipError,
  );

  assert.deepEqual(
    harness.snapshot(),
    before,
    'A relationship constraint failure must preserve the Company',
  );

  harness.setDeleteError(null);
  await repository.delete(baseCompanyRow.id);

  assert.equal(harness.snapshot(), null);
}

console.log('Company repository unit checks passed');

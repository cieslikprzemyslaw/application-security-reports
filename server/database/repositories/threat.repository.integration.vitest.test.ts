import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { CreateThreatInput } from '../../../src/domain/threat.js';
import { OWASP_TOP_10_CURRENT_VERSION } from '../../../src/domain/owaspTop10.js';
import { ValidationError } from '../../../src/validation/index.js';
import {
  RepositoryConstraintError,
  RepositoryNotFoundError,
} from '../errors.js';
import {
  createTemporaryDatabase,
  type TemporaryDatabase,
} from '../../test/temporaryDatabase.js';
import { createThreatRepository } from './threat.repository.js';

const companyId = 'cmp_00000000-0000-0000-0000-000000000001';
const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';

const buildThreatInput = (
  overrides: Partial<CreateThreatInput> = {},
): CreateThreatInput => ({
  assessmentId,
  title: 'Missing object-level authorization',
  description: 'Another customer record can be loaded.',
  severity: 'high',
  strideCategories: ['spoofing'],
  status: 'open',
  owaspCategoryCode: 'A01:2025',
  affectedEndpoint: '/api/orders/{id}',
  ...overrides,
});

describe('Threat repository with temporary SQLite', () => {
  let database: TemporaryDatabase | undefined;

  beforeEach(async () => {
    database = await createTemporaryDatabase();

    await database.prisma.company.create({
      data: {
        id: companyId,
        name: 'Northstar Digital',
      },
    });
    await database.prisma.assessment.create({
      data: {
        id: assessmentId,
        companyId,
        title: 'Customer Services Portal',
        status: 'draft',
        owaspTaxonomyVersion: OWASP_TOP_10_CURRENT_VERSION,
      },
    });
  });

  afterEach(async () => {
    await database?.cleanup();
    database = undefined;
  });

  const getDatabase = () => {
    if (!database) {
      throw new Error('Temporary database has not been created.');
    }

    return database;
  };

  it('creates, reads, filters, and patches a Threat', async () => {
    const { prisma } = getDatabase();
    const repository = createThreatRepository(prisma);

    const created = await repository.create(
      buildThreatInput({
        customCategory: 'Ignored for a standard category',
      }),
    );

    expect(created.id).toMatch(/^thr_/);
    expect(created.assessmentId).toBe(assessmentId);
    expect(created.customCategory).toBeUndefined();

    await expect(repository.findById(created.id)).resolves.toEqual(created);
    await expect(repository.findByAssessmentId(assessmentId)).resolves.toEqual([
      created,
    ]);

    const updated = await repository.update(created.id, {
      title: 'Missing authorization - retest',
      severity: 'critical',
      owaspCategoryCode: 'custom',
      customCategory: 'Internal authorization category',
    });

    expect(updated).toEqual(
      expect.objectContaining({
        id: created.id,
        assessmentId,
        title: 'Missing authorization - retest',
        severity: 'critical',
        owaspCategoryCode: 'custom',
        customCategory: 'Internal authorization category',
      }),
    );

    const stored = await prisma.threat.findUnique({
      where: { id: created.id },
    });

    expect(stored).toEqual(
      expect.objectContaining({
        assessmentId,
        title: 'Missing authorization - retest',
        severity: 'critical',
        owaspCategoryCode: 'custom',
        customCategory: 'Internal authorization category',
      }),
    );
  });

  it('rejects a missing Assessment relationship without inserting a row', async () => {
    const { prisma } = getDatabase();
    const repository = createThreatRepository(prisma);
    const countBefore = await prisma.threat.count();

    await expect(
      repository.create(
        buildThreatInput({
          assessmentId: 'asm_00000000-0000-0000-0000-000000000099',
        }),
      ),
    ).rejects.toBeInstanceOf(RepositoryNotFoundError);

    await expect(prisma.threat.count()).resolves.toBe(countBefore);
  });

  it('keeps persisted state unchanged when an invalid category PATCH is rejected', async () => {
    const { prisma } = getDatabase();
    const repository = createThreatRepository(prisma);
    const created = await repository.create(buildThreatInput());
    const before = await prisma.threat.findUnique({
      where: { id: created.id },
    });

    await expect(
      repository.update(created.id, {
        title: 'Must not persist',
        owaspCategoryCode: 'A01:2021',
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    await expect(
      prisma.threat.findUnique({
        where: { id: created.id },
      }),
    ).resolves.toEqual(before);
    await expect(prisma.threat.count()).resolves.toBe(1);
  });

  it('keeps a Threat and its link when related Evidence restricts deletion', async () => {
    const { prisma } = getDatabase();
    const repository = createThreatRepository(prisma);
    const created = await repository.create(buildThreatInput());
    const evidenceId = 'evd_00000000-0000-0000-0000-000000000001';

    await prisma.evidence.create({
      data: {
        id: evidenceId,
        assessmentId,
        type: 'note',
        title: 'Reproduction notes',
      },
    });
    await prisma.evidenceThreat.create({
      data: {
        evidenceId,
        threatId: created.id,
      },
    });

    await expect(repository.delete(created.id)).rejects.toBeInstanceOf(
      RepositoryConstraintError,
    );

    await expect(repository.findById(created.id)).resolves.not.toBeNull();
    await expect(prisma.evidenceThreat.count()).resolves.toBe(1);
  });
});

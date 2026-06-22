import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { CreateAssessmentInput } from '../../../src/domain/assessment.js';
import { OWASP_TOP_10_CURRENT_VERSION } from '../../../src/domain/owaspTop10.js';
import {
  RepositoryConstraintError,
  RepositoryNotFoundError,
} from '../errors.js';
import { createTemporaryDatabase } from '../../test/temporaryDatabase.js';
import type { TemporaryDatabase } from '../../test/temporaryDatabase.js';
import { createAssessmentRepository } from './assessment.repository.js';

const companyId = 'cmp_00000000-0000-0000-0000-000000000001';

const buildAssessmentInput = (
  overrides: Partial<CreateAssessmentInput> = {},
): CreateAssessmentInput => ({
  companyId,
  title: 'Customer Services Portal',
  description: 'Focused application security review',
  scope: 'Public web application',
  status: 'draft',
  startedAt: '2026-06-01',
  completedAt: undefined,
  applicationName: 'Customer Services Portal',
  environment: 'Production',
  assessmentType: 'Web application',
  overallRisk: 'medium',
  ...overrides,
});

describe('Assessment repository with temporary SQLite', () => {
  let database: TemporaryDatabase | undefined;

  beforeEach(async () => {
    database = await createTemporaryDatabase();
    await database.prisma.company.create({
      data: {
        id: companyId,
        name: 'Northstar Digital',
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

  it('creates, reads, filters, and patches an assessment', async () => {
    const { prisma } = getDatabase();
    const repository = createAssessmentRepository(prisma);

    const created = await repository.create(buildAssessmentInput());

    expect(created.id).toMatch(/^asm_/);
    expect(created.owaspTaxonomyVersion).toBe(OWASP_TOP_10_CURRENT_VERSION);

    await expect(repository.findById(created.id)).resolves.toEqual(created);

    const companyAssessments = await repository.findByCompanyId(companyId);
    expect(companyAssessments.map(assessment => assessment.id)).toContain(
      created.id,
    );

    const updated = await repository.update(created.id, {
      title: 'Customer Services Portal - retest',
      status: 'in-progress',
      overallRisk: 'high',
    });

    expect(updated).toEqual(
      expect.objectContaining({
        id: created.id,
        companyId,
        title: 'Customer Services Portal - retest',
        status: 'in-progress',
        overallRisk: 'high',
        owaspTaxonomyVersion: OWASP_TOP_10_CURRENT_VERSION,
      }),
    );

    const stored = await prisma.assessment.findUnique({
      where: { id: created.id },
    });

    expect(stored).toEqual(
      expect.objectContaining({
        companyId,
        title: 'Customer Services Portal - retest',
        owaspTaxonomyVersion: OWASP_TOP_10_CURRENT_VERSION,
      }),
    );
  });

  it('rejects a missing company relationship without inserting a row', async () => {
    const { prisma } = getDatabase();
    const repository = createAssessmentRepository(prisma);
    const countBefore = await prisma.assessment.count();

    await expect(
      repository.create(
        buildAssessmentInput({
          companyId: 'cmp_00000000-0000-0000-0000-000000000099',
        }),
      ),
    ).rejects.toBeInstanceOf(RepositoryConstraintError);

    await expect(prisma.assessment.count()).resolves.toBe(countBefore);
  });

  it('keeps existing state unchanged when a patch target is missing', async () => {
    const { prisma } = getDatabase();
    const repository = createAssessmentRepository(prisma);
    const created = await repository.create(buildAssessmentInput());
    const before = await repository.findById(created.id);

    await expect(
      repository.update('asm_00000000-0000-0000-0000-000000000099', {
        title: 'Must not be applied',
      }),
    ).rejects.toBeInstanceOf(RepositoryNotFoundError);

    await expect(repository.findById(created.id)).resolves.toEqual(before);
    await expect(prisma.assessment.count()).resolves.toBe(1);
  });

  it('keeps an assessment when a related report restricts deletion', async () => {
    const { prisma } = getDatabase();
    const repository = createAssessmentRepository(prisma);
    const created = await repository.create(buildAssessmentInput());

    await prisma.report.create({
      data: {
        id: 'rpt_00000000-0000-0000-0000-000000000001',
        assessmentId: created.id,
        title: 'Security assessment report',
        status: 'draft',
      },
    });

    await expect(repository.delete(created.id)).rejects.toBeInstanceOf(
      RepositoryConstraintError,
    );

    await expect(repository.findById(created.id)).resolves.not.toBeNull();
    await expect(prisma.report.count()).resolves.toBe(1);
  });

  it('cascades owned threats and evidence when deletion is allowed', async () => {
    const { prisma } = getDatabase();
    const repository = createAssessmentRepository(prisma);
    const created = await repository.create(buildAssessmentInput());

    await prisma.threat.create({
      data: {
        id: 'thr_00000000-0000-0000-0000-000000000001',
        assessmentId: created.id,
        title: 'Missing object authorization',
        description: 'Another customer record can be loaded.',
        severity: 'high',
        strideCategories: ['spoofing'],
        status: 'open',
      },
    });

    await prisma.evidence.create({
      data: {
        id: 'evd_00000000-0000-0000-0000-000000000001',
        assessmentId: created.id,
        type: 'note',
        title: 'Reproduction notes',
      },
    });

    await repository.delete(created.id);

    await expect(repository.findById(created.id)).resolves.toBeNull();
    await expect(prisma.threat.count()).resolves.toBe(0);
    await expect(prisma.evidence.count()).resolves.toBe(0);
  });
});

import { describe, expect, it, vi } from 'vitest';

import { OWASP_TOP_10_CURRENT_VERSION } from '../../../src/domain/owaspTop10.js';
import { RepositoryError } from '../errors.js';
import type { RepositoryClient } from '../repository.types.js';
import { createAssessmentRepository } from './assessment.repository.js';

const createdAt = new Date('2026-06-01T09:00:00.000Z');
const updatedAt = new Date('2026-06-10T16:30:00.000Z');

const assessmentRow = {
  id: 'asm_00000000-0000-0000-0000-000000000001',
  companyId: 'cmp_00000000-0000-0000-0000-000000000001',
  title: 'Customer Services Portal',
  description: null,
  scope: 'Public web application',
  status: 'draft',
  startedAt: null,
  completedAt: null,
  applicationName: null,
  environment: 'Production',
  assessmentType: 'Web application',
  overallRisk: 'medium',
  owaspTaxonomyVersion: OWASP_TOP_10_CURRENT_VERSION,
  createdAt,
  updatedAt,
};

const assessmentListRow = {
  ...assessmentRow,
  _count: { threats: 2 },
};

type AssessmentDelegateMock = {
  findMany: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

const createDb = (overrides: Partial<AssessmentDelegateMock> = {}) => {
  const assessment: AssessmentDelegateMock = {
    findMany: vi.fn().mockResolvedValue([assessmentListRow]),
    findUnique: vi.fn().mockResolvedValue(assessmentRow),
    create: vi.fn().mockResolvedValue(assessmentRow),
    update: vi.fn().mockResolvedValue(assessmentRow),
    delete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };

  return {
    assessment,
    db: {
      assessment,
    } as unknown as Pick<RepositoryClient, 'assessment'>,
  };
};

describe('createAssessmentRepository', () => {
  it('maps stored rows and applies stable list ordering', async () => {
    const { assessment, db } = createDb();
    const repository = createAssessmentRepository(db);

    const result = await repository.findAll();

    expect(result).toEqual([
      expect.objectContaining({
        id: assessmentRow.id,
        description: undefined,
        applicationName: null,
        owaspTaxonomyVersion: OWASP_TOP_10_CURRENT_VERSION,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
        findingsCount: 2,
      }),
    ]);
    expect(assessment.findMany).toHaveBeenCalledWith({
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      select: expect.any(Object),
    });
  });

  it('returns null when an assessment does not exist', async () => {
    const { db } = createDb({
      findUnique: vi.fn().mockResolvedValue(null),
    });
    const repository = createAssessmentRepository(db);

    await expect(repository.findById('asm_missing')).resolves.toBeNull();
  });

  it('filters assessments by company using the same stable ordering', async () => {
    const { assessment, db } = createDb();
    const repository = createAssessmentRepository(db);

    await repository.findByCompanyId(assessmentRow.companyId);

    expect(assessment.findMany).toHaveBeenCalledWith({
      where: { companyId: assessmentRow.companyId },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      select: expect.any(Object),
    });
  });

  it('creates an assessment with a generated ID and current taxonomy version', async () => {
    const { assessment, db } = createDb();
    const repository = createAssessmentRepository(db);

    await repository.create({
      companyId: assessmentRow.companyId,
      title: assessmentRow.title,
      description: undefined,
      scope: assessmentRow.scope,
      status: 'draft',
      startedAt: undefined,
      completedAt: undefined,
      applicationName: 'Customer Services Portal',
      environment: assessmentRow.environment,
      assessmentType: assessmentRow.assessmentType,
      overallRisk: 'medium',
    });

    expect(assessment.create).toHaveBeenCalledWith({
      data: {
        id: expect.stringMatching(
          /^asm_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        ),
        companyId: assessmentRow.companyId,
        title: assessmentRow.title,
        description: undefined,
        scope: assessmentRow.scope,
        status: 'draft',
        startedAt: undefined,
        completedAt: undefined,
        applicationName: 'Customer Services Portal',
        environment: assessmentRow.environment,
        assessmentType: assessmentRow.assessmentType,
        overallRisk: 'medium',
        owaspTaxonomyVersion: OWASP_TOP_10_CURRENT_VERSION,
      },
      select: expect.any(Object),
    });
  });

  it('passes only the supplied patch to the database', async () => {
    const { assessment, db } = createDb();
    const repository = createAssessmentRepository(db);

    await repository.update(assessmentRow.id, {
      title: 'Updated title',
      overallRisk: 'low',
    });

    expect(assessment.update).toHaveBeenCalledWith({
      where: { id: assessmentRow.id },
      data: {
        title: 'Updated title',
        overallRisk: 'low',
      },
      select: expect.any(Object),
    });
  });

  it('deletes by ID', async () => {
    const { assessment, db } = createDb();
    const repository = createAssessmentRepository(db);

    await repository.delete(assessmentRow.id);

    expect(assessment.delete).toHaveBeenCalledWith({
      where: { id: assessmentRow.id },
    });
  });

  it('rejects unsupported stored taxonomy versions', async () => {
    const { db } = createDb({
      findUnique: vi.fn().mockResolvedValue({
        ...assessmentRow,
        owaspTaxonomyVersion: '2099',
      }),
    });
    const repository = createAssessmentRepository(db);

    await expect(repository.findById(assessmentRow.id)).rejects.toBeInstanceOf(
      RepositoryError,
    );
  });

  it('maps failed writes without returning a successful result', async () => {
    const databaseFailure = new Error('database unavailable');
    const { db } = createDb({
      update: vi.fn().mockRejectedValue(databaseFailure),
    });
    const repository = createAssessmentRepository(db);

    await expect(
      repository.update(assessmentRow.id, {
        title: 'This must not be returned',
      }),
    ).rejects.toMatchObject({
      name: 'RepositoryError',
      cause: databaseFailure,
    });
  });
});

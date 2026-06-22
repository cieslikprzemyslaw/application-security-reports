import { describe, expect, it, vi } from 'vitest';

import type {
  CreateThreatInput,
  UpdateThreatInput,
} from '../../../src/domain/threat.js';
import { ValidationError } from '../../../src/validation/index.js';
import { RepositoryError, RepositoryNotFoundError } from '../errors.js';
import type { RepositoryClient } from '../repository.types.js';
import { createThreatRepository } from './threat.repository.js';

const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';
const threatId = 'thr_00000000-0000-0000-0000-000000000001';
const createdAt = new Date('2026-06-01T09:00:00.000Z');
const updatedAt = new Date('2026-06-10T16:30:00.000Z');

const threatRow = {
  id: threatId,
  assessmentId,
  title: 'Missing object-level authorization',
  description: 'Another customer record can be loaded.',
  severity: 'high',
  strideCategories: ['spoofing'],
  status: 'open',
  owaspCategoryCode: 'A01:2025',
  customCategory: null,
  affectedAsset: null,
  impact: 'Customer data can be disclosed.',
  recommendation: 'Enforce ownership checks.',
  remediation: null,
  observation: null,
  reproductionSteps: null,
  affectedComponent: 'Orders API',
  affectedEndpoint: '/api/orders/{id}',
  risk: null,
  references: null,
  createdAt,
  updatedAt,
};

const buildCreateInput = (
  overrides: Partial<CreateThreatInput> = {},
): CreateThreatInput => ({
  assessmentId,
  title: threatRow.title,
  description: threatRow.description,
  severity: 'high',
  strideCategories: ['spoofing'],
  status: 'open',
  owaspCategoryCode: 'A01:2025',
  affectedEndpoint: threatRow.affectedEndpoint ?? undefined,
  ...overrides,
});

type ThreatDelegateMock = {
  findUnique: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

type AssessmentDelegateMock = {
  findUnique: ReturnType<typeof vi.fn>;
};

const createDb = (
  threatOverrides: Partial<ThreatDelegateMock> = {},
  assessmentOverrides: Partial<AssessmentDelegateMock> = {},
) => {
  const threat: ThreatDelegateMock = {
    findUnique: vi.fn().mockResolvedValue(threatRow),
    findMany: vi.fn().mockResolvedValue([threatRow]),
    create: vi.fn().mockResolvedValue(threatRow),
    update: vi.fn().mockResolvedValue(threatRow),
    delete: vi.fn().mockResolvedValue(undefined),
    ...threatOverrides,
  };
  const assessment: AssessmentDelegateMock = {
    findUnique: vi.fn().mockResolvedValue({
      owaspTaxonomyVersion: '2025',
    }),
    ...assessmentOverrides,
  };

  return {
    threat,
    assessment,
    db: {
      threat,
      assessment,
    } as unknown as Pick<RepositoryClient, 'assessment' | 'threat'>,
  };
};

describe('createThreatRepository', () => {
  it('maps stored rows and applies stable Assessment list ordering', async () => {
    const { threat, db } = createDb();
    const repository = createThreatRepository(db);

    const result = await repository.findByAssessmentId(assessmentId);

    expect(result).toEqual([
      expect.objectContaining({
        id: threatId,
        assessmentId,
        customCategory: undefined,
        affectedAsset: undefined,
        affectedEndpoint: '/api/orders/{id}',
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      }),
    ]);
    expect(threat.findMany).toHaveBeenCalledWith({
      where: { assessmentId },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      select: expect.any(Object),
    });
  });

  it('creates a Threat with a generated ID and normalized category fields', async () => {
    const { threat, assessment, db } = createDb();
    const repository = createThreatRepository(db);

    await repository.create(
      buildCreateInput({
        customCategory: 'Must not persist for a standard category',
      }),
    );

    expect(assessment.findUnique).toHaveBeenCalledWith({
      where: { id: assessmentId },
      select: { owaspTaxonomyVersion: true },
    });
    expect(threat.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: expect.stringMatching(
          /^thr_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        ),
        assessmentId,
        owaspCategoryCode: 'A01:2025',
        customCategory: null,
      }),
      select: expect.any(Object),
    });
  });

  it('passes only supplied PATCH fields and clears a stale custom category', async () => {
    const customThreatRow = {
      ...threatRow,
      owaspCategoryCode: 'custom',
      customCategory: 'Internal authorization category',
    };
    const { threat, db } = createDb({
      findUnique: vi.fn().mockResolvedValue(customThreatRow),
      update: vi.fn().mockResolvedValue({
        ...customThreatRow,
        title: 'Updated title',
        owaspCategoryCode: 'A01:2025',
        customCategory: null,
      }),
    });
    const repository = createThreatRepository(db);
    const patch: UpdateThreatInput = {
      title: 'Updated title',
      owaspCategoryCode: 'A01:2025',
    };

    await repository.update(threatId, patch);

    expect(threat.update).toHaveBeenCalledWith({
      where: { id: threatId },
      data: {
        title: 'Updated title',
        owaspCategoryCode: 'A01:2025',
        customCategory: null,
      },
      select: expect.any(Object),
    });
  });

  it('rejects an unsupported category before create or PATCH writes', async () => {
    const createCase = createDb();
    const createRepository = createThreatRepository(createCase.db);

    await expect(
      createRepository.create(
        buildCreateInput({
          owaspCategoryCode: 'A01:2021',
        }),
      ),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(createCase.threat.create).not.toHaveBeenCalled();

    const updateCase = createDb();
    const updateRepository = createThreatRepository(updateCase.db);

    await expect(
      updateRepository.update(threatId, {
        owaspCategoryCode: 'A01:2021',
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(updateCase.threat.update).not.toHaveBeenCalled();
  });

  it('rejects a missing Assessment relationship without attempting create', async () => {
    const { threat, db } = createDb(
      {},
      {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    );
    const repository = createThreatRepository(db);

    await expect(repository.create(buildCreateInput())).rejects.toBeInstanceOf(
      RepositoryNotFoundError,
    );
    expect(threat.create).not.toHaveBeenCalled();
  });

  it('maps a failed PATCH write without returning a successful result', async () => {
    const databaseFailure = new Error('database unavailable');
    const { db } = createDb({
      update: vi.fn().mockRejectedValue(databaseFailure),
    });
    const repository = createThreatRepository(db);

    await expect(
      repository.update(threatId, {
        title: 'This must not be returned',
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<RepositoryError>>({
        name: 'RepositoryError',
        cause: databaseFailure,
      }),
    );
  });
});

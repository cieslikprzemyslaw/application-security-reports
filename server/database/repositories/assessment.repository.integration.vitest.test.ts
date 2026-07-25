import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { CreateAssessmentInput } from '../../../src/domain/assessment.js';
import { OWASP_TOP_10_CURRENT_VERSION } from '../../../src/domain/owaspTop10.js';
import {
  RepositoryConflictError,
  RepositoryConstraintError,
  RepositoryNotFoundError,
} from '../errors.js';
import { createTemporaryDatabase } from '../../test/temporaryDatabase.js';
import type { TemporaryDatabase } from '../../test/temporaryDatabase.js';
import {
  createAssessmentRepository,
  hasAssessmentDeletionOperations,
} from './assessment.repository.js';

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

    await prisma.threat.create({
      data: {
        id: 'thr_00000000-0000-0000-0000-000000000001',
        assessmentId: created.id,
        title: 'Missing authorization',
        description: 'Object-level authorization is missing.',
        severity: 'high',
        strideCategories: ['information-disclosure'],
        status: 'open',
      },
    });

    const companyAssessments = await repository.findByCompanyId(companyId);
    expect(companyAssessments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: created.id,
          findingsCount: 1,
        }),
      ]),
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
        cweCatalogVersion: '4.20',
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
        cweCatalogVersion: '4.20',
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

  it('previews and permanently deletes an archived Assessment atomically', async () => {
    const { prisma } = getDatabase();
    const repository = createAssessmentRepository(prisma);
    const created = await repository.create(
      buildAssessmentInput({ status: 'archived' }),
    );

    await prisma.threat.create({
      data: {
        id: 'thr_00000000-0000-0000-0000-000000000010',
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
        id: 'evd_00000000-0000-0000-0000-000000000010',
        assessmentId: created.id,
        type: 'screenshot',
        title: 'Authorization bypass',
        fileName: 'authorization-bypass.png',
        storageKey: 'uploads/evidence/authorization-bypass.png',
      },
    });

    expect(hasAssessmentDeletionOperations(repository)).toBe(true);

    if (!hasAssessmentDeletionOperations(repository)) {
      throw new Error('Expected permanent deletion operations.');
    }

    const impact = await repository.getDeletionImpact(created.id);

    expect(impact).toEqual(
      expect.objectContaining({
        assessmentId: created.id,
        threatCount: 1,
        evidenceCount: 1,
        evidenceAttachmentCount: 1,
        reportCount: 0,
        reportVersionCount: 0,
        canDelete: true,
      }),
    );

    await expect(
      repository.deletePermanently(created.id, impact.recordVersion + 1),
    ).rejects.toBeInstanceOf(RepositoryConflictError);
    await expect(repository.findById(created.id)).resolves.not.toBeNull();

    const result = await repository.deletePermanently(
      created.id,
      impact.recordVersion,
    );

    expect(result.cleanupWarnings).toHaveLength(1);
    await expect(repository.findById(created.id)).resolves.toBeNull();
    await expect(prisma.threat.count()).resolves.toBe(0);
    await expect(prisma.evidence.count()).resolves.toBe(0);
  });

  it('deletes related Reports when they have no retained versions', async () => {
    const { prisma } = getDatabase();
    const repository = createAssessmentRepository(prisma);
    const created = await repository.create(
      buildAssessmentInput({ status: 'archived' }),
    );

    await prisma.report.create({
      data: {
        id: 'rpt_00000000-0000-0000-0000-000000000011',
        assessmentId: created.id,
        title: 'Unsaved draft report',
        status: 'draft',
      },
    });

    if (!hasAssessmentDeletionOperations(repository)) {
      throw new Error('Expected permanent deletion operations.');
    }

    const impact = await repository.getDeletionImpact(created.id);

    expect(impact).toEqual(
      expect.objectContaining({
        reportCount: 1,
        reportVersionCount: 0,
        canDelete: true,
      }),
    );

    await repository.deletePermanently(created.id, impact.recordVersion);

    await expect(prisma.report.count()).resolves.toBe(0);
    await expect(repository.findById(created.id)).resolves.toBeNull();
  });

  it('reports retained Report versions and refuses permanent deletion', async () => {
    const { prisma } = getDatabase();
    const repository = createAssessmentRepository(prisma);
    const created = await repository.create(
      buildAssessmentInput({ status: 'archived' }),
    );

    await prisma.report.create({
      data: {
        id: 'rpt_00000000-0000-0000-0000-000000000010',
        assessmentId: created.id,
        title: 'Retained security report',
        status: 'draft',
        versions: {
          create: {
            id: 'rvs_00000000-0000-0000-0000-000000000010',
            version: 1,
            status: 'draft',
            generatedAt: '2026-07-25T12:00:00.000Z',
            snapshot: {},
          },
        },
      },
    });

    if (!hasAssessmentDeletionOperations(repository)) {
      throw new Error('Expected permanent deletion operations.');
    }

    const impact = await repository.getDeletionImpact(created.id);

    expect(impact).toEqual(
      expect.objectContaining({
        reportCount: 1,
        reportVersionCount: 1,
        canDelete: false,
      }),
    );
    await expect(
      repository.deletePermanently(created.id, impact.recordVersion),
    ).rejects.toBeInstanceOf(RepositoryConstraintError);
    await expect(repository.findById(created.id)).resolves.not.toBeNull();
    await expect(prisma.reportVersion.count()).resolves.toBe(1);
  });
});

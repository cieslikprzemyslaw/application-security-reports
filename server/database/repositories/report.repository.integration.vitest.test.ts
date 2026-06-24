import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { RepositoryConstraintError } from '../errors.js';
import {
  createTemporaryDatabase,
  type TemporaryDatabase,
} from '../../test/temporaryDatabase.js';
import { buildReportPreviewSnapshotFixture } from '../../test/report-preview.fixture.js';
import { createReportRepository } from './report.repository.js';

const companyId = 'cmp_00000000-0000-0000-0000-000000000001';
const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';
const threatId = 'thr_00000000-0000-0000-0000-000000000001';

describe('Report repository with temporary SQLite', () => {
  let database: TemporaryDatabase | undefined;

  beforeEach(async () => {
    database = await createTemporaryDatabase();

    await database.prisma.company.create({
      data: { id: companyId, name: 'Northstar Digital' },
    });
    await database.prisma.assessment.create({
      data: {
        id: assessmentId,
        companyId,
        title: 'Customer Services Portal',
        status: 'draft',
        owaspTaxonomyVersion: '2025',
      },
    });
    await database.prisma.threat.create({
      data: {
        id: threatId,
        assessmentId,
        title: 'Missing authorization',
        description: 'Another customer record can be loaded.',
        severity: 'high',
        strideCategories: ['spoofing'],
        status: 'open',
        owaspCategoryCode: 'A01:2025',
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

  it('creates, reads, filters, and patches a Report with Threat links', async () => {
    const { prisma } = getDatabase();
    const repository = createReportRepository(prisma);

    const created = await repository.create({
      assessmentId,
      title: 'Application Security Assessment',
      status: 'draft',
      latestVersion: 0,
      selectedThreatIds: [threatId, threatId],
      executiveSummary: 'Initial summary',
    });

    expect(created.id).toMatch(/^rpt_/);
    expect(created.selectedThreatIds).toEqual([threatId]);
    await expect(repository.findById(created.id)).resolves.toEqual(created);
    await expect(repository.findByAssessmentId(assessmentId)).resolves.toEqual([
      created,
    ]);

    const updated = await repository.update(created.id, {
      title: 'Updated report',
      selectedThreatIds: [],
    });

    expect(updated.title).toBe('Updated report');
    expect(updated.selectedThreatIds).toEqual([]);
    await expect(prisma.reportThreat.count()).resolves.toBe(0);
  });

  it('rejects a missing Assessment without inserting a Report', async () => {
    const { prisma } = getDatabase();
    const repository = createReportRepository(prisma);
    const before = await prisma.report.count();

    await expect(
      repository.create({
        assessmentId: 'asm_00000000-0000-0000-0000-000000000099',
        title: 'Invalid relationship',
        status: 'draft',
        latestVersion: 0,
        selectedThreatIds: [],
      }),
    ).rejects.toBeInstanceOf(RepositoryConstraintError);

    await expect(prisma.report.count()).resolves.toBe(before);
  });

  it('rolls back field and relationship changes when a PATCH link fails', async () => {
    const { prisma } = getDatabase();
    const repository = createReportRepository(prisma);
    const created = await repository.create({
      assessmentId,
      title: 'Original report',
      status: 'draft',
      latestVersion: 0,
      selectedThreatIds: [threatId],
    });
    const before = await prisma.report.findUnique({
      where: { id: created.id },
      include: { selectedThreats: true },
    });

    await expect(
      repository.update(created.id, {
        title: 'Must not persist',
        selectedThreatIds: ['thr_00000000-0000-0000-0000-000000000099'],
      }),
    ).rejects.toBeInstanceOf(RepositoryConstraintError);

    await expect(
      prisma.report.findUnique({
        where: { id: created.id },
        include: { selectedThreats: true },
      }),
    ).resolves.toEqual(before);
  });

  it('preserves a Report when an immutable version restricts deletion', async () => {
    const { prisma } = getDatabase();
    const repository = createReportRepository(prisma);
    const created = await repository.create({
      assessmentId,
      title: 'Versioned report',
      status: 'draft',
      latestVersion: 1,
      selectedThreatIds: [],
    });

    await prisma.reportVersion.create({
      data: {
        id: 'rpv_00000000-0000-0000-0000-000000000001',
        reportId: created.id,
        version: 1,
        status: 'draft',
        generatedAt: '2026-06-22',
        snapshot: buildReportPreviewSnapshotFixture(),
      },
    });

    await expect(repository.delete(created.id)).rejects.toBeInstanceOf(
      RepositoryConstraintError,
    );
    await expect(repository.findById(created.id)).resolves.not.toBeNull();
    await expect(prisma.reportVersion.count()).resolves.toBe(1);
  });
});

import { describe, expect, it, vi } from 'vitest';

import type {
  RepositoryClient,
  RepositoryTransactionClient,
} from '../repository.types.js';
import { RepositoryError } from '../errors.js';
import { createReportRepository } from './report.repository.js';

const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';
const firstThreatId = 'thr_00000000-0000-0000-0000-000000000001';
const secondThreatId = 'thr_00000000-0000-0000-0000-000000000002';
const reportId = 'rpt_00000000-0000-0000-0000-000000000001';
const createdAt = new Date('2026-06-22T09:00:00.000Z');

const row = {
  id: reportId,
  assessmentId,
  selectedThreats: [
    { threatId: secondThreatId, position: 0 },
    { threatId: firstThreatId, position: 1 },
  ],
  title: 'Application Security Assessment',
  status: 'draft',
  latestVersion: 1,
  executiveSummary: null,
  createdAt,
  updatedAt: createdAt,
  versions: [
    {
      id: 'rvs_00000000-0000-0000-0000-000000000001',
      version: 1,
      status: 'draft',
      generatedAt: '2026-06-22',
      createdAt,
    },
  ],
};

const createDb = () => {
  const tx = {
    report: {
      create: vi.fn().mockResolvedValue(row),
      update: vi.fn().mockResolvedValue(row),
      findUnique: vi.fn().mockResolvedValue(row),
    },
    reportThreat: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      createMany: vi.fn().mockResolvedValue({ count: 2 }),
      findFirst: vi.fn().mockResolvedValue({ position: 3 }),
      create: vi.fn().mockResolvedValue({
        reportId,
        threatId: firstThreatId,
        position: 4,
      }),
    },
  } as unknown as RepositoryTransactionClient;

  const db = {
    report: {
      findUnique: vi.fn().mockResolvedValue(row),
      findMany: vi.fn().mockResolvedValue([row]),
      delete: vi.fn().mockResolvedValue(row),
    },
    reportThreat: {
      delete: vi.fn(),
    },
    $transaction: vi.fn(async callback => callback(tx)),
  } as unknown as Pick<
    RepositoryClient,
    'report' | 'reportThreat' | '$transaction'
  >;

  return { db, tx };
};

describe('createReportRepository', () => {
  it('maps selected Threats in persisted position order', async () => {
    const { db } = createDb();
    const repository = createReportRepository(db);

    await expect(repository.findByAssessmentId(assessmentId)).resolves.toEqual([
      expect.objectContaining({
        id: reportId,
        assessmentId,
        selectedThreatIds: [secondThreatId, firstThreatId],
        executiveSummary: undefined,
        createdAt: createdAt.toISOString(),
        versions: [
          {
            id: 'rvs_00000000-0000-0000-0000-000000000001',
            version: 1,
            status: 'draft',
            generatedAt: '2026-06-22',
            createdAt: createdAt.toISOString(),
          },
        ],
      }),
    ]);
    expect(db.report.findMany).toHaveBeenCalledWith({
      where: { assessmentId },
      orderBy: [{ createdAt: 'desc' }],
      select: expect.objectContaining({
        selectedThreats: {
          select: { threatId: true, position: true },
          orderBy: [{ position: 'asc' }, { threatId: 'asc' }],
        },
      }),
    });
  });

  it('deduplicates selected Threat links without changing request order', async () => {
    const { db, tx } = createDb();
    const repository = createReportRepository(db);

    await repository.create({
      assessmentId,
      title: 'Application Security Assessment',
      status: 'draft',
      latestVersion: 0,
      selectedThreatIds: [secondThreatId, firstThreatId, secondThreatId],
    });

    expect(tx.report.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: expect.stringMatching(/^rpt_/),
        assessmentId,
        selectedThreats: {
          create: [
            { threatId: secondThreatId, position: 0 },
            { threatId: firstThreatId, position: 1 },
          ],
        },
      }),
      select: expect.any(Object),
    });
  });

  it('replaces links only when selectedThreatIds is supplied by PATCH', async () => {
    const { db, tx } = createDb();
    const repository = createReportRepository(db);

    await repository.update(reportId, { title: 'Updated title' });

    expect(tx.reportThreat.deleteMany).not.toHaveBeenCalled();

    await repository.update(reportId, {
      selectedThreatIds: [secondThreatId, firstThreatId, secondThreatId],
    });

    expect(tx.reportThreat.createMany).toHaveBeenCalledWith({
      data: [
        { reportId, threatId: secondThreatId, position: 0 },
        { reportId, threatId: firstThreatId, position: 1 },
      ],
    });

    await repository.update(reportId, { selectedThreatIds: [] });

    expect(tx.reportThreat.deleteMany).toHaveBeenLastCalledWith({
      where: { reportId },
    });
  });

  it('appends an attached Threat after the current final position', async () => {
    const { db, tx } = createDb();
    const repository = createReportRepository(db);

    await repository.attachThreat(reportId, firstThreatId);

    expect(tx.reportThreat.findFirst).toHaveBeenCalledWith({
      where: { reportId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    expect(tx.reportThreat.create).toHaveBeenCalledWith({
      data: {
        reportId,
        threatId: firstThreatId,
        position: 4,
      },
    });
  });

  it('maps a failed transaction without returning success', async () => {
    const failure = new Error('database unavailable');
    const { db } = createDb();
    db.$transaction = vi.fn().mockRejectedValue(failure);
    const repository = createReportRepository(db);

    await expect(
      repository.update(reportId, { title: 'Must not be returned' }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<RepositoryError>>({
        name: 'RepositoryError',
        cause: failure,
      }),
    );
  });
});

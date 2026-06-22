import { describe, expect, it, vi } from 'vitest';

import type {
  RepositoryClient,
  RepositoryTransactionClient,
} from '../repository.types.js';
import { RepositoryError } from '../errors.js';
import { createReportRepository } from './report.repository.js';

const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';
const threatId = 'thr_00000000-0000-0000-0000-000000000001';
const reportId = 'rpt_00000000-0000-0000-0000-000000000001';
const createdAt = new Date('2026-06-22T09:00:00.000Z');

const row = {
  id: reportId,
  assessmentId,
  selectedThreats: [{ threatId }],
  title: 'Application Security Assessment',
  status: 'draft',
  latestVersion: 1,
  executiveSummary: null,
  createdAt,
  updatedAt: createdAt,
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
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  } as unknown as RepositoryTransactionClient;

  const db = {
    report: {
      findUnique: vi.fn().mockResolvedValue(row),
      findMany: vi.fn().mockResolvedValue([row]),
      delete: vi.fn().mockResolvedValue(row),
    },
    reportThreat: {
      create: vi.fn(),
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
  it('maps rows and applies stable Assessment ordering', async () => {
    const { db } = createDb();
    const repository = createReportRepository(db);

    await expect(repository.findByAssessmentId(assessmentId)).resolves.toEqual([
      expect.objectContaining({
        id: reportId,
        assessmentId,
        selectedThreatIds: [threatId],
        executiveSummary: undefined,
        createdAt: createdAt.toISOString(),
      }),
    ]);
    expect(db.report.findMany).toHaveBeenCalledWith({
      where: { assessmentId },
      orderBy: [{ createdAt: 'desc' }],
      select: expect.any(Object),
    });
  });

  it('deduplicates selected Threat links on create', async () => {
    const { db, tx } = createDb();
    const repository = createReportRepository(db);

    await repository.create({
      assessmentId,
      title: 'Application Security Assessment',
      status: 'draft',
      latestVersion: 0,
      selectedThreatIds: [threatId, threatId],
    });

    expect(tx.report.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: expect.stringMatching(/^rpt_/),
        assessmentId,
        selectedThreats: {
          create: [{ threatId }],
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

    await repository.update(reportId, { selectedThreatIds: [] });

    expect(tx.reportThreat.deleteMany).toHaveBeenCalledWith({
      where: { reportId },
    });
    expect(tx.reportThreat.createMany).not.toHaveBeenCalled();
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

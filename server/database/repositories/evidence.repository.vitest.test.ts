import { describe, expect, it, vi } from 'vitest';

import type {
  RepositoryClient,
  RepositoryTransactionClient,
} from '../repository.types.js';
import { RepositoryError } from '../errors.js';
import { createEvidenceRepository } from './evidence.repository.js';

const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';
const threatId = 'thr_00000000-0000-0000-0000-000000000001';
const evidenceId = 'evd_00000000-0000-0000-0000-000000000001';
const createdAt = new Date('2026-06-22T09:00:00.000Z');

const row = {
  id: evidenceId,
  assessmentId,
  threatLinks: [{ threatId }],
  httpExchanges: [],
  type: 'note',
  title: 'Authorization reproduction',
  description: null,
  content: 'GET /api/orders/2',
  fileName: null,
  filePath: null,
  storageKey: null,
  mimeType: null,
  attachmentSizeBytes: null,
  capturedAt: '2026-06-22',
  createdAt,
  updatedAt: createdAt,
};

const createDb = () => {
  const tx = {
    evidence: {
      create: vi.fn().mockResolvedValue(row),
      update: vi.fn().mockResolvedValue(row),
      findUnique: vi.fn().mockResolvedValue(row),
    },
    evidenceThreat: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    evidenceExchange: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  } as unknown as RepositoryTransactionClient;

  const db = {
    evidence: {
      findUnique: vi.fn().mockResolvedValue(row),
      findMany: vi.fn().mockResolvedValue([row]),
      delete: vi.fn().mockResolvedValue(row),
    },
    evidenceThreat: {
      create: vi.fn(),
      delete: vi.fn(),
    },
    evidenceExchange: {},
    $transaction: vi.fn(async callback => callback(tx)),
  } as unknown as Pick<
    RepositoryClient,
    'evidence' | 'evidenceExchange' | 'evidenceThreat' | '$transaction'
  >;

  return { db, tx };
};

describe('createEvidenceRepository', () => {
  it('maps stored rows and applies stable Assessment ordering', async () => {
    const { db } = createDb();
    const repository = createEvidenceRepository(db);

    await expect(repository.findByAssessmentId(assessmentId)).resolves.toEqual([
      expect.objectContaining({
        id: evidenceId,
        assessmentId,
        threatIds: [threatId],
        description: undefined,
        httpExchanges: [],
        createdAt: createdAt.toISOString(),
      }),
    ]);

    expect(db.evidence.findMany).toHaveBeenCalledWith({
      where: { assessmentId },
      orderBy: [{ createdAt: 'desc' }],
      select: expect.any(Object),
    });
  });

  it('deduplicates Threat links and persists ordered HTTP exchanges on create', async () => {
    const { db, tx } = createDb();
    const repository = createEvidenceRepository(db);

    await repository.create({
      assessmentId,
      threatIds: [threatId, threatId],
      type: 'http',
      title: 'HTTP exchange',
      httpExchanges: [
        {
          request: { method: 'GET', url: '/api/orders/2' },
          response: { statusCode: 200 },
        },
      ],
    });

    expect(tx.evidence.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: expect.stringMatching(/^evd_/),
        assessmentId,
        threatLinks: {
          create: [{ threatId }],
        },
      }),
      select: expect.any(Object),
    });
    expect(tx.evidenceExchange.deleteMany).toHaveBeenCalled();
    expect(tx.evidenceExchange.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          evidenceId,
          position: 0,
        }),
      ],
    });
  });

  it('does not replace relationships when they are absent from PATCH', async () => {
    const { db, tx } = createDb();
    const repository = createEvidenceRepository(db);

    await repository.update(evidenceId, {
      title: 'Updated title',
    });

    expect(tx.evidence.update).toHaveBeenCalledWith({
      where: { id: evidenceId },
      data: expect.objectContaining({
        title: 'Updated title',
      }),
    });
    expect(tx.evidenceThreat.deleteMany).not.toHaveBeenCalled();
    expect(tx.evidenceExchange.deleteMany).not.toHaveBeenCalled();
  });

  it('maps a failed transaction and returns no successful result', async () => {
    const failure = new Error('database unavailable');
    const { db } = createDb();
    db.$transaction = vi.fn().mockRejectedValue(failure);

    const repository = createEvidenceRepository(db);

    await expect(
      repository.update(evidenceId, { title: 'Must not be returned' }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<RepositoryError>>({
        name: 'RepositoryError',
        cause: failure,
      }),
    );
  });
});

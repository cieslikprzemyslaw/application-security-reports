import { describe, expect, it, vi } from 'vitest';

import type {
  RepositoryClient,
  RepositoryTransactionClient,
} from '../repository.types.js';
import { createReportVersionRepository } from './reportVersion.repository.js';

const reportId = 'rpt_00000000-0000-0000-0000-000000000001';
const companyId = 'cmp_00000000-0000-0000-0000-000000000001';
const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';
const threatId = 'thr_00000000-0000-0000-0000-000000000001';
const evidenceId = 'evd_00000000-0000-0000-0000-000000000001';

const createDb = () => {
  const transaction = {
    company: { findUnique: vi.fn().mockResolvedValue(null) },
    assessment: { findUnique: vi.fn().mockResolvedValue(null) },
    threat: { findUnique: vi.fn().mockResolvedValue(null) },
    evidence: { findUnique: vi.fn().mockResolvedValue(null) },
    report: {
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
    },
    reportVersion: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
    settings: { findFirst: vi.fn().mockResolvedValue(null) },
  } as unknown as RepositoryTransactionClient;

  const db = {
    report: transaction.report,
    reportVersion: transaction.reportVersion,
    $transaction: vi.fn(async operation => operation(transaction)),
  } as unknown as Pick<
    RepositoryClient,
    'report' | 'reportVersion' | '$transaction'
  >;

  return { db, transaction };
};

describe('ReportVersion finalisation transaction repositories', () => {
  it('binds every finalisation lookup and write repository to one transaction client', async () => {
    const { db, transaction } = createDb();
    const repository = createReportVersionRepository(db);

    await repository.withFinalisationTransaction(async repositories => {
      await repositories.companyRepository.findById(companyId);
      await repositories.assessmentRepository.findById(assessmentId);
      await repositories.threatRepository.findById(threatId);
      await repositories.evidenceRepository.findById(evidenceId);
      await repositories.reportRepository.findById(reportId);
      await repositories.settingsRepository.get();
      await repositories.reportVersionRepository.findByReportId(reportId);
    });

    expect(db.$transaction).toHaveBeenCalledOnce();
    expect(transaction.company.findUnique).toHaveBeenCalledOnce();
    expect(transaction.assessment.findUnique).toHaveBeenCalledOnce();
    expect(transaction.threat.findUnique).toHaveBeenCalledOnce();
    expect(transaction.evidence.findUnique).toHaveBeenCalledOnce();
    expect(transaction.report.findUnique).toHaveBeenCalledOnce();
    expect(transaction.settings.findFirst).toHaveBeenCalledOnce();
    expect(transaction.reportVersion.findMany).toHaveBeenCalledOnce();
  });

  it('preserves an operation error so callers can map conflicts without an automatic retry', async () => {
    const { db } = createDb();
    const repository = createReportVersionRepository(db);
    const failure = new Error('version conflict');

    await expect(
      repository.withFinalisationTransaction(async () => {
        throw failure;
      }),
    ).rejects.toBe(failure);
    expect(db.$transaction).toHaveBeenCalledOnce();
  });
});

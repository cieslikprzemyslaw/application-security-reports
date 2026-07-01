import { describe, expect, it, vi } from 'vitest';

import { buildReportPreviewSnapshotFixture } from '../../test/report-preview.fixture.js';
import { RepositoryConflictError } from '../errors.js';

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
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    reportVersion: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      delete: vi.fn(),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
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
  it('binds every finalisation lookup and write repository to one transaction client without automatic retention deletes', async () => {
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
      await repositories.reportVersionRepository.applyRetention(reportId, 10);
      await repositories.reportVersionRepository.updateReportLatestVersionIfCurrent(
        reportId,
        0,
        10,
      );
    });

    expect(db.$transaction).toHaveBeenCalledOnce();
    expect(transaction.company.findUnique).toHaveBeenCalledOnce();
    expect(transaction.assessment.findUnique).toHaveBeenCalledOnce();
    expect(transaction.threat.findUnique).toHaveBeenCalledOnce();
    expect(transaction.evidence.findUnique).toHaveBeenCalledOnce();
    expect(transaction.report.findUnique).toHaveBeenCalledOnce();
    expect(transaction.settings.findFirst).toHaveBeenCalledOnce();
    expect(transaction.reportVersion.findMany).toHaveBeenCalledOnce();
    expect(transaction.reportVersion.deleteMany).not.toHaveBeenCalled();
    expect(transaction.report.updateMany).toHaveBeenCalledWith({
      where: { id: reportId, latestVersion: 0 },
      data: { latestVersion: 10 },
    });
  });

  it('deletes one version and recalculates the parent latestVersion in one transaction', async () => {
    const { db, transaction } = createDb();
    const repository = createReportVersionRepository(db);
    vi.mocked(transaction.reportVersion.findFirst)
      .mockResolvedValueOnce({
        id: 'rvs_00000000-0000-0000-0000-000000000001',
        reportId,
        version: 10,
        status: 'final',
        generatedAt: '2026-06-25',
        filePath: null,
        snapshot: buildReportPreviewSnapshotFixture(),
      })
      .mockResolvedValueOnce({ version: 3 });

    const result = await repository.deleteByReportIdAndVersionId(
      reportId,
      'rvs_00000000-0000-0000-0000-000000000001',
    );

    expect(db.$transaction).toHaveBeenCalledOnce();
    expect(transaction.reportVersion.delete).toHaveBeenCalledWith({
      where: { id: 'rvs_00000000-0000-0000-0000-000000000001' },
    });
    expect(transaction.report.update).toHaveBeenCalledWith({
      where: { id: reportId },
      data: { latestVersion: 3 },
    });
    expect(result).toMatchObject({ latestVersion: 3 });
  });

  it('rejects a stale latestVersion compare-and-set update', async () => {
    const { db, transaction } = createDb();
    vi.mocked(transaction.report.updateMany).mockResolvedValueOnce({
      count: 0,
    });
    const repository = createReportVersionRepository(db);

    await expect(
      repository.withFinalisationTransaction(repositories =>
        repositories.reportVersionRepository.updateReportLatestVersionIfCurrent(
          reportId,
          0,
          10,
        ),
      ),
    ).rejects.toBeInstanceOf(RepositoryConflictError);
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

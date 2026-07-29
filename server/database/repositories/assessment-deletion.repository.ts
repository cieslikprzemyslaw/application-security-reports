import type {
  AssessmentDeletionImpact,
  AssessmentPermanentDeleteResult,
} from '../../../src/domain/assessment.js';
import {
  mapPrismaError,
  RepositoryConflictError,
  RepositoryConstraintError,
  RepositoryNotFoundError,
  RepositoryStateError,
} from '../errors.js';
import type {
  RepositoryClient,
  RepositoryTransactionClient,
} from '../repository.types.js';

export interface AssessmentDeletionOperations {
  getDeletionImpact(id: string): Promise<AssessmentDeletionImpact>;
  deletePermanently(
    id: string,
    recordVersion?: number,
  ): Promise<AssessmentPermanentDeleteResult>;
}

export type AssessmentDeletionDb = Pick<
  RepositoryClient,
  | 'assessment'
  | 'threat'
  | 'threatCwe'
  | 'evidence'
  | 'evidenceExchange'
  | 'evidenceThreat'
  | 'report'
  | 'reportVersion'
  | 'reportThreat'
  | '$transaction'
>;

const toRecordVersion = (updatedAt: Date): number => updatedAt.getTime();

type DeletionEntityIdRow = {
  id: string;
};

type DeletionReportVersionCountRow = {
  _count: {
    versions: number;
  };
};

const loadDeletionImpact = async (
  db: Omit<AssessmentDeletionDb, '$transaction'>,
  id: string,
): Promise<AssessmentDeletionImpact & { updatedAt: Date }> => {
  const assessment = await db.assessment.findUnique({
    where: { id },
    select: { id: true, status: true, updatedAt: true },
  });

  if (!assessment) {
    throw new RepositoryNotFoundError('Assessment not found.');
  }

  const [threatCount, evidenceCount, evidenceAttachmentCount, reportRows] =
    await Promise.all([
      db.threat.count({ where: { assessmentId: id } }),
      db.evidence.count({ where: { assessmentId: id } }),
      db.evidence.count({
        where: {
          assessmentId: id,
          OR: [
            { fileName: { not: null } },
            { filePath: { not: null } },
            { storageKey: { not: null } },
          ],
        },
      }),
      db.report.findMany({
        where: { assessmentId: id },
        select: {
          id: true,
          _count: { select: { versions: true } },
        },
      }),
    ]);

  const reportVersionCount = reportRows.reduce(
    (total: number, report: DeletionReportVersionCountRow) =>
      total + report._count.versions,
    0,
  );
  const warnings: string[] = [];

  if (assessment.status !== 'archived') {
    warnings.push('Archive the Assessment before permanent deletion.');
  }

  if (reportVersionCount > 0) {
    warnings.push(
      'Retained Report versions prevent permanent deletion because their snapshots must remain immutable.',
    );
  }

  if (evidenceAttachmentCount > 0) {
    warnings.push(
      'Evidence attachment files are stored outside the database transaction and may require separate cleanup.',
    );
  }

  return {
    assessmentId: assessment.id,
    recordVersion: toRecordVersion(assessment.updatedAt),
    threatCount,
    evidenceCount,
    evidenceAttachmentCount,
    reportCount: reportRows.length,
    reportVersionCount,
    canDelete: assessment.status === 'archived' && reportVersionCount === 0,
    warnings,
    updatedAt: assessment.updatedAt,
  };
};

const deleteAssessmentChildren = async (
  tx: RepositoryTransactionClient,
  assessmentId: string,
) => {
  const [threats, evidence, reports] = await Promise.all([
    tx.threat.findMany({
      where: { assessmentId },
      select: { id: true },
    }),
    tx.evidence.findMany({
      where: { assessmentId },
      select: { id: true },
    }),
    tx.report.findMany({
      where: { assessmentId },
      select: { id: true },
    }),
  ]);
  const threatIds = threats.map((threat: DeletionEntityIdRow) => threat.id);
  const evidenceIds = evidence.map((item: DeletionEntityIdRow) => item.id);
  const reportIds = reports.map((report: DeletionEntityIdRow) => report.id);

  if (evidenceIds.length > 0) {
    await tx.evidenceExchange.deleteMany({
      where: { evidenceId: { in: evidenceIds } },
    });
    await tx.evidenceThreat.deleteMany({
      where: { evidenceId: { in: evidenceIds } },
    });
  }

  if (reportIds.length > 0 || threatIds.length > 0) {
    await tx.reportThreat.deleteMany({
      where: {
        OR: [
          ...(reportIds.length > 0 ? [{ reportId: { in: reportIds } }] : []),
          ...(threatIds.length > 0 ? [{ threatId: { in: threatIds } }] : []),
        ],
      },
    });
  }

  if (threatIds.length > 0) {
    await tx.evidenceThreat.deleteMany({
      where: { threatId: { in: threatIds } },
    });
    await tx.threatCwe?.deleteMany({
      where: { threatId: { in: threatIds } },
    });
  }

  await tx.evidence.deleteMany({ where: { assessmentId } });
  await tx.threat.deleteMany({ where: { assessmentId } });
  await tx.report.deleteMany({ where: { assessmentId } });
};

export const createAssessmentDeletionOperations = (
  db: AssessmentDeletionDb,
): AssessmentDeletionOperations => ({
  async getDeletionImpact(id) {
    const { updatedAt: _updatedAt, ...impact } = await loadDeletionImpact(
      db,
      id,
    );
    return impact;
  },

  async deletePermanently(id, recordVersion) {
    const impact = await loadDeletionImpact(db, id);

    if (recordVersion !== undefined && recordVersion !== impact.recordVersion) {
      throw new RepositoryConflictError('Assessment record version is stale.');
    }

    if (!impact.canDelete) {
      if (impact.reportVersionCount > 0) {
        throw new RepositoryConstraintError(
          'Assessment cannot be deleted while related Reports exist.',
        );
      }

      throw new RepositoryStateError(
        'Only archived Assessments can be permanently deleted.',
      );
    }

    try {
      await db.$transaction(async (tx: RepositoryTransactionClient) => {
        await deleteAssessmentChildren(tx, id);

        const deleted = await tx.assessment.deleteMany({
          where: {
            id,
            status: 'archived',
            updatedAt: impact.updatedAt,
          },
        });

        if (deleted.count !== 1) {
          throw new RepositoryConflictError(
            'Assessment changed during permanent deletion.',
          );
        }
      });
    } catch (error) {
      throw mapPrismaError(error);
    }

    return {
      cleanupWarnings:
        impact.evidenceAttachmentCount > 0
          ? [
              'The database records were deleted, but Evidence attachment files may require separate cleanup.',
            ]
          : [],
    };
  },
});

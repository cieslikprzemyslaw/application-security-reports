import type { Report } from '../../../src/domain/report.js';
import type {
  CreateReportInput,
  UpdateReportInput,
} from '../../../src/domain/report.js';
import { generateId } from '../../utils/id.js';
import { mapPrismaError } from '../errors.js';
import type {
  RepositoryClient,
  RepositoryTransactionClient,
} from '../repository.types.js';
import {
  dedupeStrings,
  toIsoString,
  toOptionalText,
} from './repository.helpers.js';

export interface ReportRepository {
  findById(id: string): Promise<Report | null>;
  findByAssessmentId(assessmentId: string): Promise<Report[]>;
  create(input: CreateReportInput): Promise<Report>;
  update(id: string, input: UpdateReportInput): Promise<Report>;
  delete(id: string): Promise<void>;
  attachThreat(reportId: string, threatId: string): Promise<void>;
  detachThreat(reportId: string, threatId: string): Promise<void>;
}

type ReportRepositoryDb = Pick<
  RepositoryClient,
  'report' | 'reportThreat' | '$transaction'
>;

type ReportLookupDb = Pick<RepositoryClient, 'report'>;

type ReportLinkDb = Pick<RepositoryClient, 'reportThreat'>;

type ReportRow = {
  id: string;
  assessmentId: string;
  selectedThreats: Array<{ threatId: string }>;
  title: string;
  status: string;
  latestVersion: number;
  executiveSummary: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const reportSelect = {
  id: true,
  assessmentId: true,
  selectedThreats: {
    select: { threatId: true },
    orderBy: { threatId: 'asc' },
  },
  title: true,
  status: true,
  latestVersion: true,
  executiveSummary: true,
  createdAt: true,
  updatedAt: true,
} as const;

const toReport = (row: ReportRow): Report => ({
  id: row.id,
  assessmentId: row.assessmentId,
  title: row.title,
  status: row.status as Report['status'],
  selectedThreatIds: row.selectedThreats.map(link => link.threatId),
  latestVersion: row.latestVersion,
  executiveSummary: toOptionalText(row.executiveSummary),
  createdAt: toIsoString(row.createdAt),
  updatedAt: toIsoString(row.updatedAt),
});

const loadReportById = async (
  db: ReportLookupDb,
  id: string,
): Promise<Report | null> => {
  const report = await db.report.findUnique({
    where: { id },
    select: reportSelect,
  });

  return report ? toReport(report) : null;
};

const replaceReportThreatLinks = async (
  db: ReportLinkDb,
  reportId: string,
  threatIds: readonly string[],
) => {
  await db.reportThreat.deleteMany({
    where: { reportId },
  });

  const uniqueThreatIds = dedupeStrings(threatIds);

  if (uniqueThreatIds.length === 0) {
    return;
  }

  await db.reportThreat.createMany({
    data: uniqueThreatIds.map(threatId => ({ reportId, threatId })),
  });
};

export function createReportRepository(
  db: ReportRepositoryDb,
): ReportRepository {
  return {
    async findById(id) {
      return loadReportById(db, id);
    },

    async findByAssessmentId(assessmentId) {
      const reports = await db.report.findMany({
        where: { assessmentId },
        orderBy: [{ createdAt: 'desc' }],
        select: reportSelect,
      });

      return reports.map(toReport);
    },

    async create(input) {
      try {
        return await db.$transaction(
          async (tx: RepositoryTransactionClient) => {
            const report = await tx.report.create({
              data: {
                id: generateId('report'),
                assessmentId: input.assessmentId,
                title: input.title,
                status: input.status,
                latestVersion: input.latestVersion,
                executiveSummary: input.executiveSummary,
                selectedThreats: input.selectedThreatIds
                  ? {
                      create: dedupeStrings(input.selectedThreatIds).map(
                        threatId => ({
                          threatId,
                        }),
                      ),
                    }
                  : undefined,
              },
              select: reportSelect,
            });

            return toReport(report);
          },
        );
      } catch (error) {
        throw mapPrismaError(error);
      }
    },

    async update(id, input) {
      try {
        return await db.$transaction(
          async (tx: RepositoryTransactionClient) => {
            await tx.report.update({
              where: { id },
              data: {
                assessmentId: input.assessmentId,
                title: input.title,
                status: input.status,
                latestVersion: input.latestVersion,
                executiveSummary: input.executiveSummary,
              },
            });

            if (input.selectedThreatIds) {
              await replaceReportThreatLinks(tx, id, input.selectedThreatIds);
            }

            const report = await loadReportById(tx, id);

            if (!report) {
              throw new Error('Report disappeared during update.');
            }

            return report;
          },
        );
      } catch (error) {
        throw mapPrismaError(error);
      }
    },

    async delete(id) {
      try {
        await db.report.delete({ where: { id } });
      } catch (error) {
        throw mapPrismaError(error);
      }
    },

    async attachThreat(reportId, threatId) {
      try {
        await db.reportThreat.create({
          data: { reportId, threatId },
        });
      } catch (error) {
        throw mapPrismaError(error);
      }
    },

    async detachThreat(reportId, threatId) {
      try {
        await db.reportThreat.delete({
          where: {
            reportId_threatId: {
              reportId,
              threatId,
            },
          },
        });
      } catch (error) {
        throw mapPrismaError(error);
      }
    },
  };
}

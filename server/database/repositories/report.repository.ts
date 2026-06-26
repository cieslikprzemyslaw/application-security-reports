import type { Report } from '../../../src/domain/report.js';
import type {
  AssessmentReportListItem,
  ReportVersionSummary,
} from '../../../src/domain/report-list.js';
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
  findByAssessmentId(assessmentId: string): Promise<AssessmentReportListItem[]>;
  create(input: CreateReportInput): Promise<Report>;
  update(id: string, input: UpdateReportInput): Promise<Report>;
  delete(id: string): Promise<void>;
  attachThreat(reportId: string, threatId: string): Promise<void>;
  detachThreat(reportId: string, threatId: string): Promise<void>;
}

export type ReportLookupRepository = Pick<ReportRepository, 'findById'>;

type ReportRepositoryDb = Pick<
  RepositoryClient,
  'report' | 'reportThreat' | '$transaction'
>;

type ReportLookupDb = Pick<RepositoryClient, 'report'>;

type ReportLinkDb = Pick<RepositoryTransactionClient, 'reportThreat'>;

type ReportRow = {
  id: string;
  assessmentId: string;
  selectedThreats: Array<{ threatId: string; position: number }>;
  title: string;
  status: string;
  latestVersion: number;
  executiveSummary: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ReportListRow = ReportRow & {
  versions: Array<{
    id: string;
    version: number;
    status: string;
    generatedAt: string;
  }>;
};

const reportSelect = {
  id: true,
  assessmentId: true,
  selectedThreats: {
    select: { threatId: true, position: true },
    orderBy: { position: 'asc' as const },
  },
  title: true,
  status: true,
  latestVersion: true,
  executiveSummary: true,
  createdAt: true,
  updatedAt: true,
} as const;

const reportListSelect = {
  ...reportSelect,
  versions: {
    select: {
      id: true,
      version: true,
      status: true,
      generatedAt: true,
    },
    orderBy: { version: 'desc' as const },
  },
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

const toReportVersionSummary = (
  version: ReportListRow['versions'][number],
): ReportVersionSummary => ({
  id: version.id,
  version: version.version,
  status: version.status as ReportVersionSummary['status'],
  generatedAt: version.generatedAt as ReportVersionSummary['generatedAt'],
});

const toAssessmentReportListItem = (
  row: ReportListRow,
): AssessmentReportListItem => ({
  ...toReport(row),
  versions: row.versions.map(toReportVersionSummary),
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

export function createReportLookupRepository(
  db: ReportLookupDb,
): ReportLookupRepository {
  return {
    async findById(id) {
      return loadReportById(db, id);
    },
  };
}

const toOrderedReportThreatLinks = (
  reportId: string,
  threatIds: readonly string[],
) =>
  dedupeStrings(threatIds).map((threatId, position) => ({
    reportId,
    threatId,
    position,
  }));

const replaceReportThreatLinks = async (
  db: ReportLinkDb,
  reportId: string,
  threatIds: readonly string[],
) => {
  await db.reportThreat.deleteMany({
    where: { reportId },
  });

  const links = toOrderedReportThreatLinks(reportId, threatIds);

  if (links.length === 0) {
    return;
  }

  await db.reportThreat.createMany({
    data: links,
  });
};

export function createReportRepository(
  db: ReportRepositoryDb,
): ReportRepository {
  return {
    ...createReportLookupRepository(db),

    async findByAssessmentId(assessmentId) {
      const reports = await db.report.findMany({
        where: { assessmentId },
        orderBy: [{ createdAt: 'desc' }],
        select: reportListSelect,
      });

      return reports.map(toAssessmentReportListItem);
    },

    async create(input) {
      try {
        return await db.$transaction(
          async (tx: RepositoryTransactionClient) => {
            const reportId = generateId('report');
            const selectedThreatLinks = input.selectedThreatIds
              ? toOrderedReportThreatLinks(reportId, input.selectedThreatIds)
              : [];

            const report = await tx.report.create({
              data: {
                id: reportId,
                assessmentId: input.assessmentId,
                title: input.title,
                status: input.status,
                latestVersion: input.latestVersion,
                executiveSummary: input.executiveSummary,
                selectedThreats:
                  selectedThreatLinks.length > 0
                    ? {
                        create: selectedThreatLinks.map(
                          ({ threatId, position }) => ({
                            threatId,
                            position,
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
        await db.$transaction(
          async (tx: RepositoryTransactionClient): Promise<void> => {
            const lastLink = await tx.reportThreat.findFirst({
              where: { reportId },
              orderBy: { position: 'desc' },
              select: { position: true },
            });

            await tx.reportThreat.create({
              data: {
                reportId,
                threatId,
                position: (lastLink?.position ?? -1) + 1,
              },
            });
          },
        );
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

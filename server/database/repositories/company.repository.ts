import type { Company } from '../../../src/domain/company.js';
import type {
  CreateCompanyInput,
  UpdateCompanyInput,
} from '../../../src/domain/company.js';
import { generateId } from '../../utils/id.js';
import {
  mapPrismaError,
  RepositoryNotFoundError,
  RepositoryStateError,
} from '../errors.js';
import type { RepositoryClient } from '../repository.types.js';
import {
  createCompanyLifecycleOperations,
  type CompanyLifecycleDb,
  type CompanyLifecycleOperations,
} from './company-lifecycle.repository.js';
import { toIsoString, toOptionalText } from './repository.helpers.js';

export interface CompanyOverviewCounts {
  total: number;
  draft: number;
  inProgress: number;
  completed: number;
}

export interface CompanyOverviewRecentAssessment {
  id: string;
  applicationName: string;
  companyName: string;
  assessmentType: string;
  severity: string;
  findingsCount: number;
  status: string;
}

export interface CompanyOverview {
  company: Company;
  assessmentCounts: CompanyOverviewCounts;
  recentAssessments: CompanyOverviewRecentAssessment[];
  recentReports: null;
}

export interface CompanyRepository extends CompanyLifecycleOperations {
  findAll(): Promise<Company[]>;
  findById(id: string): Promise<Company | null>;
  findOverview(companyId: string): Promise<CompanyOverview | null>;
  create(input: CreateCompanyInput, id?: string): Promise<Company>;
  update(id: string, input: UpdateCompanyInput): Promise<Company>;
  updateLogoUrl(id: string, logoUrl: string | null): Promise<Company>;
  delete(id: string): Promise<void>;
}

type CompanyRepositoryDb = Pick<RepositoryClient, 'company' | 'assessment'> &
  Partial<Pick<RepositoryClient, 'activity' | '$transaction'>>;

type CompanyRow = {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  contactName: string | null;
  contactEmail: string | null;
  logoUrl: string | null;
  footerText: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type RecentAssessmentRow = {
  id: string;
  applicationName: string | null;
  assessmentType: string | null;
  overallRisk: string | null;
  status: string;
  _count: { threats: number };
};

const companySelect = {
  id: true,
  name: true,
  description: true,
  website: true,
  contactName: true,
  contactEmail: true,
  logoUrl: true,
  footerText: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const toCompany = (row: CompanyRow): Company => ({
  id: row.id,
  name: row.name,
  description: toOptionalText(row.description),
  website: toOptionalText(row.website),
  contactName: toOptionalText(row.contactName),
  contactEmail: toOptionalText(row.contactEmail),
  logoUrl: row.logoUrl,
  footerText: toOptionalText(row.footerText),
  archivedAt: row.archivedAt ? toIsoString(row.archivedAt) : null,
  createdAt: toIsoString(row.createdAt),
  updatedAt: toIsoString(row.updatedAt),
});

const hasLifecycleDb = (
  db: CompanyRepositoryDb,
): db is CompanyRepositoryDb & CompanyLifecycleDb =>
  'activity' in db && typeof db.$transaction === 'function';

const createLegacyLifecycleOperations = (
  db: Pick<RepositoryClient, 'company'>,
): CompanyLifecycleOperations => ({
  async archive(id) {
    const existing = await db.company.findUnique({
      where: { id },
      select: { archivedAt: true },
    });

    if (!existing) {
      throw new RepositoryNotFoundError();
    }

    if (existing.archivedAt !== null) {
      throw new RepositoryStateError('Company is already archived.');
    }

    try {
      return toCompany(
        await db.company.update({
          where: { id },
          data: { archivedAt: new Date() },
          select: companySelect,
        }),
      );
    } catch (error) {
      throw mapPrismaError(error);
    }
  },

  async restore(id) {
    const existing = await db.company.findUnique({
      where: { id },
      select: { archivedAt: true },
    });

    if (!existing) {
      throw new RepositoryNotFoundError();
    }

    if (existing.archivedAt === null) {
      throw new RepositoryStateError('Company is not archived.');
    }

    try {
      return toCompany(
        await db.company.update({
          where: { id },
          data: { archivedAt: null },
          select: companySelect,
        }),
      );
    } catch (error) {
      throw mapPrismaError(error);
    }
  },
});

export function createCompanyRepository(
  db: CompanyRepositoryDb,
): CompanyRepository {
  const lifecycle = hasLifecycleDb(db)
    ? createCompanyLifecycleOperations(db)
    : createLegacyLifecycleOperations(db);

  return {
    ...lifecycle,

    async findAll() {
      const companies = await db.company.findMany({
        orderBy: { name: 'asc' },
        where: { archivedAt: null },
        select: companySelect,
      });

      return companies.map(toCompany);
    },

    async findById(id) {
      const company = await db.company.findUnique({
        where: { id },
        select: companySelect,
      });

      return company ? toCompany(company) : null;
    },

    async findOverview(companyId) {
      const company = await db.company.findUnique({
        where: { id: companyId },
        select: companySelect,
      });

      if (!company) return null;

      const grouped = await db.assessment.groupBy({
        by: ['status'],
        where: { companyId },
        _count: { _all: true },
      });
      const groupedByStatus: Array<{
        status: string;
        _count: { _all: number };
      }> = grouped;
      const activeGroups = groupedByStatus.filter(
        group => group.status !== 'archived',
      );
      const countByStatus = (status: string) =>
        activeGroups.find(group => group.status === status)?._count._all ?? 0;

      const recent: RecentAssessmentRow[] = await db.assessment.findMany({
        where: { companyId },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        take: 5,
        select: {
          id: true,
          applicationName: true,
          assessmentType: true,
          overallRisk: true,
          status: true,
          _count: { select: { threats: true } },
        },
      });
      const activeRecent = recent.filter(
        assessment => assessment.status !== 'archived',
      );

      return {
        company: toCompany(company),
        assessmentCounts: {
          total: activeGroups.reduce(
            (sum, group) => sum + group._count._all,
            0,
          ),
          draft: countByStatus('draft'),
          inProgress: countByStatus('in-progress'),
          completed: countByStatus('completed'),
        },
        recentAssessments: activeRecent.map(assessment => ({
          id: assessment.id,
          applicationName: assessment.applicationName ?? '',
          companyName: company.name,
          assessmentType: assessment.assessmentType ?? '',
          severity: assessment.overallRisk ?? 'informational',
          findingsCount: assessment._count.threats,
          status: assessment.status,
        })),
        recentReports: null,
      };
    },

    async create(input, id = generateId('company')) {
      try {
        return toCompany(
          await db.company.create({
            data: {
              id,
              name: input.name,
              description: input.description,
              website: input.website,
              contactName: input.contactName,
              contactEmail: input.contactEmail,
              footerText: input.footerText,
            },
            select: companySelect,
          }),
        );
      } catch (error) {
        throw mapPrismaError(error);
      }
    },

    async update(id, input) {
      try {
        return toCompany(
          await db.company.update({
            where: { id },
            data: {
              ...(input.name !== undefined ? { name: input.name } : {}),
              ...(input.description !== undefined
                ? { description: input.description }
                : {}),
              ...(input.website !== undefined
                ? { website: input.website }
                : {}),
              ...(input.contactName !== undefined
                ? { contactName: input.contactName }
                : {}),
              ...(input.contactEmail !== undefined
                ? { contactEmail: input.contactEmail }
                : {}),
              ...(input.footerText !== undefined
                ? { footerText: input.footerText }
                : {}),
            },
            select: companySelect,
          }),
        );
      } catch (error) {
        throw mapPrismaError(error);
      }
    },

    async updateLogoUrl(id, logoUrl) {
      try {
        return toCompany(
          await db.company.update({
            where: { id },
            data: { logoUrl },
            select: companySelect,
          }),
        );
      } catch (error) {
        throw mapPrismaError(error);
      }
    },

    async delete(id) {
      try {
        await db.company.delete({ where: { id } });
      } catch (error) {
        if (error instanceof RepositoryNotFoundError) {
          throw error;
        }
        throw mapPrismaError(error);
      }
    },
  };
}

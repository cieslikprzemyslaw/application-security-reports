import type { Company } from '../../../src/domain/company.js';
import type {
  CreateCompanyInput,
  UpdateCompanyInput,
} from '../../../src/domain/company.js';
import { generateId } from '../../utils/id.js';
import { mapPrismaError, RepositoryNotFoundError } from '../errors.js';
import type { RepositoryClient } from '../repository.types.js';
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

export interface CompanyRepository {
  findAll(): Promise<Company[]>;
  findById(id: string): Promise<Company | null>;
  findOverview(companyId: string): Promise<CompanyOverview | null>;
  create(input: CreateCompanyInput, id?: string): Promise<Company>;
  update(id: string, input: UpdateCompanyInput): Promise<Company>;
  delete(id: string): Promise<void>;
}

type CompanyRepositoryDb = Pick<RepositoryClient, 'company' | 'assessment'>;

type CompanyRow = {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  contactName: string | null;
  contactEmail: string | null;
  logoPath: string | null;
  footerText: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const companySelect = {
  id: true,
  name: true,
  description: true,
  website: true,
  contactName: true,
  contactEmail: true,
  logoPath: true,
  footerText: true,
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
  logoPath: toOptionalText(row.logoPath),
  footerText: toOptionalText(row.footerText),
  createdAt: toIsoString(row.createdAt),
  updatedAt: toIsoString(row.updatedAt),
});

export function createCompanyRepository(
  db: CompanyRepositoryDb,
): CompanyRepository {
  return {
    async findAll() {
      const companies = await db.company.findMany({
        orderBy: { name: 'asc' },
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

      const countByStatus = (status: string) =>
        groupedByStatus.find((g: { status: string }) => g.status === status)
          ?._count._all ?? 0;

      const recent = await db.assessment.findMany({
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

      type RecentAssessmentRow = {
        id: string;
        applicationName: string | null;
        assessmentType: string | null;
        overallRisk: string | null;
        status: string;
        _count: { threats: number };
      };

      return {
        company: toCompany(company),
        assessmentCounts: {
          total: groupedByStatus.reduce(
            (sum: number, g: { _count: { _all: number } }) =>
              sum + g._count._all,
            0,
          ),
          draft: countByStatus('draft'),
          inProgress: countByStatus('in-progress'),
          completed: countByStatus('completed'),
        },
        recentAssessments: recent.map((a: RecentAssessmentRow) => ({
          id: a.id,
          applicationName: a.applicationName ?? '',
          companyName: company.name,
          assessmentType: a.assessmentType ?? '',
          severity: a.overallRisk ?? 'informational',
          findingsCount: a._count.threats,
          status: a.status,
        })),
        recentReports: null,
      };
    },

    async create(input, id = generateId('company')) {
      try {
        const company = await db.company.create({
          data: {
            id,
            name: input.name,
            description: input.description,
            website: input.website,
            contactName: input.contactName,
            contactEmail: input.contactEmail,
            logoPath: input.logoPath,
            footerText: input.footerText,
          },
          select: companySelect,
        });

        return toCompany(company);
      } catch (error) {
        throw mapPrismaError(error);
      }
    },

    async update(id, input) {
      try {
        const company = await db.company.update({
          where: { id },
          data: {
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.description !== undefined
              ? { description: input.description }
              : {}),
            ...(input.website !== undefined ? { website: input.website } : {}),
            ...(input.contactName !== undefined
              ? { contactName: input.contactName }
              : {}),
            ...(input.contactEmail !== undefined
              ? { contactEmail: input.contactEmail }
              : {}),
            ...(input.logoPath !== undefined
              ? { logoPath: input.logoPath }
              : {}),
            ...(input.footerText !== undefined
              ? { footerText: input.footerText }
              : {}),
          },
          select: companySelect,
        });

        return toCompany(company);
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

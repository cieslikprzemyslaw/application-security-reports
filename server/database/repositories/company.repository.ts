import type { Company } from '../../../src/domain/company.js';
import type {
  CreateCompanyInput,
  UpdateCompanyInput,
} from '../../../src/domain/company.js';
import { generateId } from '../../utils/id.js';
import { mapPrismaError, RepositoryNotFoundError } from '../errors.js';
import type { RepositoryClient } from '../repository.types.js';
import { toIsoString, toOptionalText } from './repository.helpers.js';

export interface CompanyRepository {
  findAll(): Promise<Company[]>;
  findById(id: string): Promise<Company | null>;
  create(input: CreateCompanyInput, id?: string): Promise<Company>;
  update(id: string, input: UpdateCompanyInput): Promise<Company>;
  delete(id: string): Promise<void>;
}

type CompanyRepositoryDb = Pick<RepositoryClient, 'company'>;

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
          data: input,
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

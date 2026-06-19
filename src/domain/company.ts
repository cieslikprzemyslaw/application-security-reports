import type { CompanyId, TimestampedEntity } from './common.js';

export interface Company extends TimestampedEntity {
  id: CompanyId;
  name: string;
  description?: string;
  website?: string;
  contactName?: string;
  contactEmail?: string;
  /** @deprecated No longer populated by the repository. Use logoUrl. */
  logoPath?: string;
  logoUrl?: string | null;
  footerText?: string;
}

export type CompanyListItem = Company & {
  assessmentCount: number;
};

export type CreateCompanyInput = Omit<
  Company,
  'id' | 'createdAt' | 'updatedAt' | 'logoUrl' | 'logoPath'
>;

export type UpdateCompanyInput = Partial<CreateCompanyInput>;

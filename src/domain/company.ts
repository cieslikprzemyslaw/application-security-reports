import type { TimestampedEntity, CompanyId, ISODateString } from './common';

export interface Company extends TimestampedEntity {
  id: CompanyId;
  name: string;
  description?: string;
  website?: string;
  contactName?: string;
  contactEmail?: string;
  logoPath?: string;
  footerText?: string;
}

export type CompanyListItem = Company & {
  assessmentCount: number;
};

export type CreateCompanyInput = Omit<Company, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateCompanyInput = Partial<CreateCompanyInput>;

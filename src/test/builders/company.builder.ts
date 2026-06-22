import type { Company, CompanyListItem } from '~/domain';

export const buildCompany = (overrides: Partial<Company> = {}): Company => ({
  id: 'cmp_test',
  name: 'Northwind Digital',
  description: 'Test company',
  website: 'https://example.com',
  contactName: 'Alex Tester',
  contactEmail: 'alex@example.com',
  logoUrl: null,
  footerText: 'Confidential',
  archivedAt: null,
  createdAt: '2026-01-01T09:00:00.000Z',
  updatedAt: '2026-01-02T10:00:00.000Z',
  ...overrides,
});

export const buildCompanyListItem = (
  overrides: Partial<CompanyListItem> = {},
): CompanyListItem => ({
  ...buildCompany(overrides),
  assessmentCount: 2,
  ...overrides,
});

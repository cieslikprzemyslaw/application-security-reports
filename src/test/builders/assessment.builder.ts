import type { Assessment } from '~/domain';

export const buildAssessment = (
  overrides: Partial<Assessment> = {},
): Assessment => ({
  id: 'asm_test',
  companyId: 'cmp_test',
  title: 'Web Application Assessment',
  description: 'Security assessment for the customer portal.',
  scope: 'Customer-facing web application and API.',
  status: 'in-progress',
  startedAt: '2026-01-03',
  applicationName: 'Customer Portal',
  environment: 'Production',
  assessmentType: 'Web application',
  overallRisk: 'medium',
  owaspTaxonomyVersion: '2025',
  createdAt: '2026-01-01T09:00:00.000Z',
  updatedAt: '2026-01-03T11:00:00.000Z',
  ...overrides,
});

import { describe, expect, it } from 'vitest';

import { settingsSchema } from './settings.schema.js';

const validSettings = {
  id: 'set_00000000-0000-0000-0000-000000000001',
  organisationName: 'Northstar Digital',
  consultantName: 'Alex Mercer',
  consultantRole: 'Lead Pentester',
  consultantEmail: 'alex.mercer@appsec.io',
  defaultReportTitle: 'Application Security Assessment',
  defaultSeverity: 'medium' as const,
  theme: 'system' as const,
  dateFormat: 'YYYY-MM-DD' as const,
  includeEvidence: true,
  confidentialReports: true,
  allowedBrandingModes: ['issuer', 'client'] as const,
  defaultBrandingMode: 'issuer' as const,
  createdAt: '2026-07-25T08:00:00.000Z',
  updatedAt: '2026-07-25T08:00:00.000Z',
};

describe('Settings schema', () => {
  it('parses the supported singleton contract', () => {
    expect(settingsSchema.parse(validSettings)).toEqual(validSettings);
  });

  it('rejects invalid branding defaults and unknown fields', () => {
    expect(
      settingsSchema.safeParse({
        ...validSettings,
        allowedBrandingModes: ['client'],
      }).success,
    ).toBe(false);
    expect(
      settingsSchema.safeParse({
        ...validSettings,
        apiToken: 'secret',
      }).success,
    ).toBe(false);
  });

  it('rejects invalid identity and preference values', () => {
    expect(
      settingsSchema.safeParse({
        ...validSettings,
        consultantEmail: 'not-an-email',
      }).success,
    ).toBe(false);
    expect(
      settingsSchema.safeParse({
        ...validSettings,
        theme: 'solarized',
      }).success,
    ).toBe(false);
  });
});

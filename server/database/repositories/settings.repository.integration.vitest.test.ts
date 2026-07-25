import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createTemporaryDatabase,
  type TemporaryDatabase,
} from '../../test/temporaryDatabase.js';
import { createSettingsRepository } from './settings.repository.js';

const settingsInput = {
  organisationName: 'Northstar Digital',
  consultantName: 'Alex Mercer',
  consultantEmail: 'alex.mercer@appsec.io',
  defaultReportTitle: 'Application Security Assessment',
  defaultSeverity: 'medium' as const,
  theme: 'system' as const,
  dateFormat: 'YYYY-MM-DD' as const,
  includeEvidence: true,
  confidentialReports: true,
  allowedBrandingModes: ['issuer', 'client'] as Array<'issuer' | 'client'>,
  defaultBrandingMode: 'issuer' as const,
};

describe.sequential('Settings repository integration', () => {
  let database: TemporaryDatabase;

  beforeEach(async () => {
    database = await createTemporaryDatabase();
  });

  afterEach(async () => {
    await database.cleanup();
  });

  it('creates one Settings row and updates the same singleton', async () => {
    const repository = createSettingsRepository(database.prisma);
    const created = await repository.upsert(settingsInput);
    const updated = await repository.upsert({
      ...settingsInput,
      organisationName: 'Updated Organisation',
      includeEvidence: false,
    });

    expect(updated.id).toBe(created.id);
    expect(updated.organisationName).toBe('Updated Organisation');
    expect(updated.includeEvidence).toBe(false);
    await expect(database.prisma.settings.count()).resolves.toBe(1);
  });

  it('updates issuer identity without creating another Settings row', async () => {
    const repository = createSettingsRepository(database.prisma);
    const created = await repository.upsert(settingsInput);
    const updated = await repository.updateIssuerLogoId(
      'logo_00000000-0000-0000-0000-000000000001',
    );

    expect(updated.id).toBe(created.id);
    expect(updated.issuerLogoId).toBe(
      'logo_00000000-0000-0000-0000-000000000001',
    );
    await expect(database.prisma.settings.count()).resolves.toBe(1);
  });

  it('leaves the singleton unchanged when a database write fails', async () => {
    const repository = createSettingsRepository(database.prisma);
    const created = await repository.upsert(settingsInput);

    await database.prisma.$executeRawUnsafe(
      'ALTER TABLE "Settings" RENAME TO "SettingsUnavailable"',
    );

    await expect(
      repository.upsert({ ...settingsInput, organisationName: 'Not persisted' }),
    ).rejects.toThrow();

    await database.prisma.$executeRawUnsafe(
      'ALTER TABLE "SettingsUnavailable" RENAME TO "Settings"',
    );
    await expect(repository.get()).resolves.toEqual(created);
  });
});

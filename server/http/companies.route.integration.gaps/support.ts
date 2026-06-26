import { vi } from 'vitest';

import { createRepositories } from '../../database/repositories/index.js';
import {
  createIntegrationDatabase,
  startCompanyApiServer,
} from '../companies.route.integration.test/helpers.js';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {},
}));

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details: Array<{ path?: string; message?: string; code?: string }>;
  };
};

type IntegrationDatabase = Awaited<
  ReturnType<typeof createIntegrationDatabase>
>;

export type CompanyApiHarness = {
  database: IntegrationDatabase;
  repositories: ReturnType<typeof createRepositories>;
  server: Awaited<ReturnType<typeof startCompanyApiServer>>;
};

export const missingCompanyId = 'cmp_00000000-0000-0000-0000-000000000099';
export const malformedCompanyId = 'not-a-company-id';

export const readError = async (response: Response): Promise<ApiErrorBody> =>
  response.json() as Promise<ApiErrorBody>;

const createHarness = async (): Promise<CompanyApiHarness> => {
  const database = await createIntegrationDatabase(
    'appsec-companies-api-gaps-',
  );
  const repositories = createRepositories(database.prisma);

  try {
    const server = await startCompanyApiServer({
      assessmentRepository: repositories.assessment,
      companyRepository: repositories.company,
      evidenceRepository: repositories.evidence,
      reportRepository: repositories.report,
      reportVersionRepository: repositories.reportVersion,
      settingsRepository: repositories.settings,
      threatRepository: repositories.threat,
    });

    return { database, repositories, server };
  } catch (error) {
    await database.cleanup();
    throw error;
  }
};

export const withHarness = async (
  run: (harness: CompanyApiHarness) => Promise<void>,
) => {
  const harness = await createHarness();

  try {
    await run(harness);
  } finally {
    try {
      await harness.server.close();
    } finally {
      await harness.database.cleanup();
    }
  }
};

export const createCompany = (
  repositories: CompanyApiHarness['repositories'],
  name = 'Northstar Digital',
) =>
  repositories.company.create({
    name,
    description: 'Security consulting and managed assessment services',
    website: 'https://northstar.example',
    contactName: 'Alex Mercer',
    contactEmail: 'security@northstar.example',
    footerText: 'Confidential - do not distribute.',
  });

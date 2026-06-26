import assert from 'node:assert/strict';

import { describe, it, vi } from 'vitest';

import { createRepositories } from '../database/repositories/index.js';
import {
  createIntegrationDatabase,
  startCompanyApiServer,
} from './companies.route.integration.test/helpers.js';

vi.mock('../lib/prisma.js', () => ({
  prisma: {},
}));

type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details: Array<{ path?: string; message?: string; code?: string }>;
  };
};

type IntegrationDatabase = Awaited<
  ReturnType<typeof createIntegrationDatabase>
>;

type CompanyApiHarness = {
  database: IntegrationDatabase;
  repositories: ReturnType<typeof createRepositories>;
  server: Awaited<ReturnType<typeof startCompanyApiServer>>;
};

const missingCompanyId = 'cmp_00000000-0000-0000-0000-000000000099';
const malformedCompanyId = 'not-a-company-id';

const readError = async (response: Response): Promise<ApiErrorBody> =>
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

    return {
      database,
      repositories,
      server,
    };
  } catch (error) {
    await database.cleanup();
    throw error;
  }
};

const withHarness = async (
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

const createCompany = (
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

describe('Companies API integration gaps', () => {
  it('returns safe validation and missing-resource errors without persistence', async () => {
    await withHarness(async ({ database, server }) => {
      const countBefore = await database.prisma.company.count();

      const unknownFieldResponse = await fetch(
        `${server.baseUrl}/api/companies`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: 'cmp_00000000-0000-0000-0000-000000000088',
            name: 'Must not persist',
          }),
        },
      );
      const unknownFieldBody = await readError(unknownFieldResponse);

      assert.equal(unknownFieldResponse.status, 400);
      assert.equal(unknownFieldBody.error.code, 'VALIDATION_ERROR');
      assert.equal(
        unknownFieldBody.error.details.some(detail => detail.path === 'id'),
        true,
      );
      assert.equal(await database.prisma.company.count(), countBefore);

      const invalidFieldsResponse = await fetch(
        `${server.baseUrl}/api/companies`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Invalid contact data',
            website: 'not-a-url',
            contactEmail: 'not-an-email',
          }),
        },
      );
      const invalidFieldsBody = await readError(invalidFieldsResponse);

      assert.equal(invalidFieldsResponse.status, 400);
      assert.equal(invalidFieldsBody.error.code, 'VALIDATION_ERROR');
      assert.equal(
        invalidFieldsBody.error.details.some(
          detail => detail.path === 'website' || detail.path === 'contactEmail',
        ),
        true,
      );
      assert.equal(await database.prisma.company.count(), countBefore);

      const unsupportedMediaResponse = await fetch(
        `${server.baseUrl}/api/companies`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ name: 'Must not persist' }),
        },
      );
      const unsupportedMediaBody = await readError(unsupportedMediaResponse);

      assert.equal(unsupportedMediaResponse.status, 415);
      assert.equal(unsupportedMediaBody.error.code, 'UNSUPPORTED_MEDIA_TYPE');
      assert.equal(await database.prisma.company.count(), countBefore);

      const malformedRequests: Array<{
        path: string;
        init?: RequestInit;
      }> = [
        {
          path: `/api/companies/${malformedCompanyId}`,
        },
        {
          path: `/api/companies/${malformedCompanyId}/overview`,
        },
        {
          path: `/api/companies/${malformedCompanyId}`,
          init: {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Must not persist' }),
          },
        },
        {
          path: `/api/companies/${malformedCompanyId}`,
          init: { method: 'DELETE' },
        },
        {
          path: `/api/companies/${malformedCompanyId}/archive`,
          init: {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}',
          },
        },
        {
          path: `/api/companies/${malformedCompanyId}/restore`,
          init: {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}',
          },
        },
      ];

      for (const request of malformedRequests) {
        const response = await fetch(
          `${server.baseUrl}${request.path}`,
          request.init,
        );
        const body = await readError(response);

        assert.equal(response.status, 400);
        assert.equal(body.error.code, 'VALIDATION_ERROR');
        assert.equal(
          body.error.details.some(detail => detail.path === 'id'),
          true,
        );
      }

      const missingRequests: Array<{
        init?: RequestInit;
      }> = [
        {},
        {
          init: {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Must not persist' }),
          },
        },
        {
          init: { method: 'DELETE' },
        },
      ];

      for (const request of missingRequests) {
        const response = await fetch(
          `${server.baseUrl}/api/companies/${missingCompanyId}`,
          request.init,
        );
        const body = await readError(response);

        assert.equal(response.status, 404);
        assert.equal(body.error.code, 'COMPANY_NOT_FOUND');
        assert.equal(body.error.message, 'Company not found');
        assert.deepEqual(body.error.details, []);
      }

      assert.equal(await database.prisma.company.count(), countBefore);
    });
  });

  it('rejects empty and server-owned PATCH fields without changing the row', async () => {
    await withHarness(async ({ database, repositories, server }) => {
      const company = await createCompany(repositories);
      const rowBefore = await database.prisma.company.findUnique({
        where: { id: company.id },
      });

      assert.ok(rowBefore);

      const invalidPatchBodies = [
        {},
        {
          name: 'Must not persist',
          archivedAt: '2026-06-26T12:00:00.000Z',
        },
        {
          website: 'not-a-url',
          contactEmail: 'not-an-email',
        },
      ];

      for (const body of invalidPatchBodies) {
        const response = await fetch(
          `${server.baseUrl}/api/companies/${company.id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          },
        );
        const error = await readError(response);

        assert.equal(response.status, 400);
        assert.equal(error.error.code, 'VALIDATION_ERROR');
        assert.deepEqual(
          await database.prisma.company.findUnique({
            where: { id: company.id },
          }),
          rowBefore,
        );
      }

      assert.equal(await database.prisma.company.count(), 1);
    });
  });

  it('preserves the Company and Assessment after a delete conflict', async () => {
    await withHarness(async ({ database, repositories, server }) => {
      const company = await createCompany(
        repositories,
        'Company with assessment',
      );
      const assessment = await repositories.assessment.create({
        companyId: company.id,
        title: 'Deletion conflict assessment',
        status: 'draft',
        description: 'Keeps the parent Company from being deleted.',
        scope: 'Company deletion rules',
        startedAt: '2026-06-01',
        completedAt: undefined,
        applicationName: 'Customer Portal',
        environment: 'test',
        assessmentType: 'web',
        overallRisk: 'medium',
      });
      const companyBefore = await database.prisma.company.findUnique({
        where: { id: company.id },
      });
      const assessmentBefore = await database.prisma.assessment.findUnique({
        where: { id: assessment.id },
      });

      const response = await fetch(
        `${server.baseUrl}/api/companies/${company.id}`,
        {
          method: 'DELETE',
        },
      );
      const body = await readError(response);

      assert.equal(response.status, 409);
      assert.deepEqual(body, {
        error: {
          code: 'COMPANY_DELETE_CONFLICT',
          message: 'Company cannot be deleted while related assessments exist',
          details: [],
        },
      });
      assert.deepEqual(
        await database.prisma.company.findUnique({
          where: { id: company.id },
        }),
        companyBefore,
      );
      assert.deepEqual(
        await database.prisma.assessment.findUnique({
          where: { id: assessment.id },
        }),
        assessmentBefore,
      );
    });
  });

  it('does not leak SQLite or persistence details from an unexpected failure', async () => {
    await withHarness(async ({ database, server }) => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      try {
        await database.prisma.$executeRawUnsafe(
          'ALTER TABLE "Company" RENAME TO "CompanyUnavailable"',
        );

        const response = await fetch(`${server.baseUrl}/api/companies`);
        const body = await readError(response);
        const serializedBody = JSON.stringify(body);

        assert.equal(response.status, 500);
        assert.deepEqual(body, {
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Unexpected server error',
            details: [],
          },
        });
        assert.equal(serializedBody.includes('no such table'), false);
        assert.equal(serializedBody.includes('CompanyUnavailable'), false);
        assert.equal(serializedBody.includes(database.tempDir), false);
        assert.equal(consoleError.mock.calls.length > 0, true);
      } finally {
        consoleError.mockRestore();
      }
    });
  });
});

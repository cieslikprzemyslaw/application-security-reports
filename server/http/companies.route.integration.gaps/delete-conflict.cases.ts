import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { createCompany, readError, withHarness } from './support.js';

describe('Companies API delete conflicts', () => {
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
});

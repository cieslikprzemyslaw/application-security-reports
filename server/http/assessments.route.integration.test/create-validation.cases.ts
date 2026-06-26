import { expect, it } from 'vitest';

import {
  buildCreatePayload,
  describeAssessmentsRouteIntegration,
  missingCompanyId,
  readJson,
} from './caseSupport.js';

describeAssessmentsRouteIntegration(
  'Assessments API integration create validation',
  getHarness => {
    it('rejects an invalid create request without persisting any fields', async () => {
      const { server, prisma, company } = getHarness();
      const countBefore = await prisma.assessment.count();

      const response = await fetch(`${server.baseUrl}/api/assessments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          buildCreatePayload(company.id, {
            id: 'asm_client_controlled',
          }),
        ),
      });

      expect(response.status).toBe(400);
      await expect(readJson(response)).resolves.toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: [
            {
              path: 'id',
              message: 'Unknown property: id',
              code: 'unrecognized_keys',
            },
          ],
        },
      });
      await expect(prisma.assessment.count()).resolves.toBe(countBefore);
    });

    it('rejects a missing Company relationship without creating an assessment', async () => {
      const { server, prisma } = getHarness();
      const countBefore = await prisma.assessment.count();

      const response = await fetch(`${server.baseUrl}/api/assessments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildCreatePayload(missingCompanyId)),
      });

      expect(response.status).toBe(404);
      await expect(readJson(response)).resolves.toEqual({
        error: {
          code: 'COMPANY_NOT_FOUND',
          message: 'Company not found',
          details: [],
        },
      });
      await expect(prisma.assessment.count()).resolves.toBe(countBefore);
    });
  },
);

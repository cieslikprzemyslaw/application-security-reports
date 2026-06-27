import { expect, it } from 'vitest';

import { OWASP_TOP_10_CURRENT_VERSION } from '../../../src/domain/owaspTop10.js';
import {
  buildCreatePayload,
  describeAssessmentsRouteIntegration,
  readJson,
} from './caseSupport.js';

describeAssessmentsRouteIntegration(
  'Assessments API integration CRUD',
  getHarness => {
    it('creates, reads, lists, filters, updates, and persists an assessment', async () => {
      const { server, prisma, company } = getHarness();

      const createResponse = await fetch(`${server.baseUrl}/api/assessments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildCreatePayload(company.id)),
      });

      expect(createResponse.status).toBe(201);

      const createBody = await readJson<{
        data: {
          id: string;
          companyId: string;
          title: string;
          applicationName: string;
          owaspTaxonomyVersion: string;
        };
      }>(createResponse);

      expect(createResponse.headers.get('location')).toBe(
        `/api/assessments/${createBody.data.id}`,
      );
      expect(createBody.data.id).toMatch(/^asm_/);
      expect(createBody.data).toEqual(
        expect.objectContaining({
          companyId: company.id,
          title: 'Payments Portal',
          applicationName: 'Payments Portal',
          owaspTaxonomyVersion: OWASP_TOP_10_CURRENT_VERSION,
        }),
      );

      const getResponse = await fetch(
        `${server.baseUrl}/api/assessments/${createBody.data.id}`,
      );
      expect(getResponse.status).toBe(200);
      await expect(readJson(getResponse)).resolves.toEqual({
        data: expect.objectContaining({
          id: createBody.data.id,
          companyId: company.id,
        }),
      });

      const allResponse = await fetch(`${server.baseUrl}/api/assessments`);
      expect(allResponse.status).toBe(200);

      const allBody = await readJson<{
        data: Array<{ id: string }>;
      }>(allResponse);

      expect(allBody.data).toHaveLength(2);
      expect(allBody.data[0]?.id).toBe(createBody.data.id);

      await prisma.threat.create({
        data: {
          id: 'thr_00000000-0000-0000-0000-000000000077',
          assessmentId: createBody.data.id,
          title: 'Missing authorization',
          description: 'Object-level authorization is missing.',
          severity: 'high',
          strideCategories: ['information-disclosure'],
          status: 'open',
        },
      });

      const listResponse = await fetch(
        `${server.baseUrl}/api/assessments?companyId=${company.id}`,
      );
      expect(listResponse.status).toBe(200);

      const listBody = await readJson<{
        data: Array<{ id: string; companyId: string; findingsCount: number }>;
      }>(listResponse);

      expect(listBody.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: createBody.data.id,
            companyId: company.id,
            findingsCount: 1,
          }),
        ]),
      );

      const patchResponse = await fetch(
        `${server.baseUrl}/api/assessments/${createBody.data.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Payments Portal Retest',
            applicationName: ' Payments Portal Public Site ',
            overallRisk: 'medium',
          }),
        },
      );

      expect(patchResponse.status).toBe(200);
      await expect(readJson(patchResponse)).resolves.toEqual({
        data: expect.objectContaining({
          id: createBody.data.id,
          title: 'Payments Portal Retest',
          applicationName: 'Payments Portal Public Site',
          overallRisk: 'medium',
          owaspTaxonomyVersion: OWASP_TOP_10_CURRENT_VERSION,
        }),
      });

      const stored = await prisma.assessment.findUnique({
        where: { id: createBody.data.id },
      });

      expect(stored).toEqual(
        expect.objectContaining({
          companyId: company.id,
          title: 'Payments Portal Retest',
          applicationName: 'Payments Portal Public Site',
          overallRisk: 'medium',
          owaspTaxonomyVersion: OWASP_TOP_10_CURRENT_VERSION,
        }),
      );
    });
  },
);

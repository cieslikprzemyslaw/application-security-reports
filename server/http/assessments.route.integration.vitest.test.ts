import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { OWASP_TOP_10_CURRENT_VERSION } from '../../src/domain/owaspTop10.js';
import {
  createAssessmentsRouteIntegrationHarness,
  type AssessmentsRouteIntegrationHarness,
} from './assessments.route.integration.test/support.js';

const missingCompanyId = 'cmp_00000000-0000-0000-0000-000000000099';
const missingAssessmentId = 'asm_00000000-0000-0000-0000-000000000099';

const readJson = async <T>(response: Response): Promise<T> =>
  response.json() as Promise<T>;

const buildCreatePayload = (
  companyId: string,
  overrides: Record<string, unknown> = {},
) => ({
  companyId,
  title: 'Payments Portal',
  description: 'Focused application security assessment',
  scope: 'Public web application',
  status: 'in-progress',
  startedAt: '2026-06-20',
  applicationName: 'Payments Portal',
  environment: 'Production',
  assessmentType: 'Web App',
  overallRisk: 'high',
  ...overrides,
});

describe.sequential('Assessments API integration', () => {
  let harness: AssessmentsRouteIntegrationHarness | undefined;

  beforeEach(async () => {
    harness = await createAssessmentsRouteIntegrationHarness();
  });

  afterEach(async () => {
    await harness?.cleanup();
    harness = undefined;
  });

  const getHarness = (): AssessmentsRouteIntegrationHarness => {
    if (!harness) {
      throw new Error('Assessment integration harness is not available.');
    }

    return harness;
  };

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

    const listResponse = await fetch(
      `${server.baseUrl}/api/assessments?companyId=${company.id}`,
    );
    expect(listResponse.status).toBe(200);

    const listBody = await readJson<{
      data: Array<{ id: string; companyId: string }>;
    }>(listResponse);

    expect(listBody.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createBody.data.id,
          companyId: company.id,
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

  it('returns safe not-found errors and leaves existing data unchanged', async () => {
    const { server, prisma, assessment } = getHarness();
    const before = await prisma.assessment.findUnique({
      where: { id: assessment.id },
    });

    const getResponse = await fetch(
      `${server.baseUrl}/api/assessments/${missingAssessmentId}`,
    );

    expect(getResponse.status).toBe(404);
    await expect(readJson(getResponse)).resolves.toEqual({
      error: {
        code: 'ASSESSMENT_NOT_FOUND',
        message: 'Assessment not found',
        details: [],
      },
    });

    const patchResponse = await fetch(
      `${server.baseUrl}/api/assessments/${missingAssessmentId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Must not be persisted',
        }),
      },
    );

    expect(patchResponse.status).toBe(404);
    await expect(readJson(patchResponse)).resolves.toEqual({
      error: {
        code: 'ASSESSMENT_NOT_FOUND',
        message: 'Assessment not found',
        details: [],
      },
    });

    await expect(
      prisma.assessment.findUnique({
        where: { id: assessment.id },
      }),
    ).resolves.toEqual(before);
  });

  it('rejects an invalid patch without partially updating the assessment', async () => {
    const { server, prisma, assessment } = getHarness();
    const before = await prisma.assessment.findUnique({
      where: { id: assessment.id },
    });

    const response = await fetch(
      `${server.baseUrl}/api/assessments/${assessment.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Must not be persisted',
          applicationName: '   ',
        }),
      },
    );

    expect(response.status).toBe(400);

    const body = await readJson<{
      error: {
        code: string;
        message: string;
        details: Array<{ path: string; message: string }>;
      };
    }>(response);

    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toBe('Request validation failed');
    expect(body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'applicationName',
          message: expect.stringContaining('Text is required'),
        }),
      ]),
    );

    await expect(
      prisma.assessment.findUnique({
        where: { id: assessment.id },
      }),
    ).resolves.toEqual(before);
  });
});

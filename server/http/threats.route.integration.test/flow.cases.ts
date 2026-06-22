import assert from 'node:assert/strict';

import { RepositoryNotFoundError } from '../../database/errors.js';
import { OWASP_TOP_10_CURRENT_VERSION } from '../../../src/domain/index.js';
import type { ThreatsRouteIntegrationHarness } from './support.js';

export const runThreatsRouteIntegrationCases = async ({
  threatRepository,
  evidenceRepository,
  reportRepository,
  primaryAssessment,
  secondaryThreat,
  server,
}: ThreatsRouteIntegrationHarness) => {
  const createResponse = await fetch(`${server.baseUrl}/api/threats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      assessmentId: primaryAssessment.id,
      title: 'Missing Server-Side Authorization',
      description: 'The endpoint returns another customer order.',
      severity: 'critical',
      strideCategories: ['spoofing', 'tampering'],
      status: 'accepted-risk',
      owaspCategoryCode: 'A09:2021',
      affectedAsset: '/api/v1/orders/{id}',
      impact: 'Unauthorised access to customer order data',
      recommendation: 'Apply object-level authorization on every request.',
      observation: 'An authenticated user can access another customer order.',
      affectedComponent: 'Orders API',
      affectedEndpoint: '/api/v1/orders/{id}',
      risk: 'Sensitive order data is exposed.',
    }),
  });

  assert.equal(createResponse.status, 201);
  assert.equal(
    createResponse.headers.get('location')?.startsWith('/api/threats/thr_'),
    true,
  );
  const createdJson = (await createResponse.json()) as {
    data: {
      id: string;
      assessmentId: string;
      assessmentOwaspTaxonomyVersion: string;
      severity: string;
      owaspCategoryCode?: string;
      customCategory?: string;
    };
  };
  assert.equal(createdJson.data.id.startsWith('thr_'), true);
  assert.equal(createdJson.data.assessmentId, primaryAssessment.id);
  assert.equal(
    createdJson.data.assessmentOwaspTaxonomyVersion,
    OWASP_TOP_10_CURRENT_VERSION,
  );
  assert.equal(createdJson.data.severity, 'critical');
  assert.equal(createdJson.data.owaspCategoryCode, 'A09:2025');
  assert.equal(createdJson.data.customCategory, undefined);

  const invalidCreateResponse = await fetch(`${server.baseUrl}/api/threats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      assessmentId: primaryAssessment.id,
      title: 'Missing Server-Side Authorization',
      description: 'The endpoint returns another customer order.',
      severity: 'critical',
      strideCategories: ['spoofing', 'tampering'],
      status: 'accepted-risk',
      owaspCategoryCode: 'A09:2021',
      affectedAsset: '/api/v1/orders/{id}',
      impact: 'Unauthorised access to customer order data',
      recommendation: 'Apply object-level authorization on every request.',
      observation: 'An authenticated user can access another customer order.',
      affectedComponent: 'Orders API',
      affectedEndpoint: '/api/v1/orders/{id}',
      risk: 'Sensitive order data is exposed.',
    }),
  });

  assert.equal(invalidCreateResponse.status, 400);
  const invalidCreateJson = (await invalidCreateResponse.json()) as {
    error: {
      code: string;
      details: Array<{ path: string }>;
    };
  };
  assert.equal(invalidCreateJson.error.code, 'VALIDATION_ERROR');
  assert.equal(
    invalidCreateJson.error.details.some(
      detail => detail.path === 'owaspCategoryCode',
    ),
    true,
  );

  const primaryThreatId = createdJson.data.id;

  const customGetResponse = await fetch(
    `${server.baseUrl}/api/threats/${secondaryThreat.id}`,
  );
  assert.equal(customGetResponse.status, 200);
  const customGetJson = (await customGetResponse.json()) as {
    data: {
      id: string;
      assessmentOwaspTaxonomyVersion: string;
      owaspCategoryCode?: string;
      customCategory?: string;
    };
  };
  assert.equal(customGetJson.data.id, secondaryThreat.id);
  assert.equal(
    customGetJson.data.assessmentOwaspTaxonomyVersion,
    OWASP_TOP_10_CURRENT_VERSION,
  );
  assert.equal(customGetJson.data.owaspCategoryCode, 'custom');
  assert.equal(customGetJson.data.customCategory, 'Information exposure');

  const listResponse = await fetch(
    `${server.baseUrl}/api/threats?assessmentId=${primaryAssessment.id}`,
  );
  assert.equal(listResponse.status, 200);
  const listJson = (await listResponse.json()) as {
    data: Array<{
      id: string;
      assessmentOwaspTaxonomyVersion: string;
      owaspCategoryCode?: string;
    }>;
  };
  assert.equal(listJson.data.length, 1);
  assert.equal(listJson.data[0]?.id, primaryThreatId);
  assert.equal(
    listJson.data[0]?.assessmentOwaspTaxonomyVersion,
    OWASP_TOP_10_CURRENT_VERSION,
  );
  assert.equal(listJson.data[0]?.owaspCategoryCode, 'A09:2025');

  const getResponse = await fetch(
    `${server.baseUrl}/api/threats/${primaryThreatId}`,
  );
  assert.equal(getResponse.status, 200);
  const getJson = (await getResponse.json()) as {
    data: {
      id: string;
      assessmentId: string;
      title: string;
      assessmentOwaspTaxonomyVersion: string;
      owaspCategoryCode?: string;
    };
  };
  assert.equal(getJson.data.id, primaryThreatId);
  assert.equal(getJson.data.assessmentId, primaryAssessment.id);
  assert.equal(
    getJson.data.assessmentOwaspTaxonomyVersion,
    OWASP_TOP_10_CURRENT_VERSION,
  );
  assert.equal(getJson.data.owaspCategoryCode, 'A09:2025');

  const patchResponse = await fetch(
    `${server.baseUrl}/api/threats/${primaryThreatId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Missing server-side authorization',
        status: 'mitigated',
        risk: 'Risk reduced after remediation',
      }),
    },
  );
  assert.equal(patchResponse.status, 200);
  const patchJson = (await patchResponse.json()) as {
    data: {
      id: string;
      title: string;
      status: string;
      risk?: string;
      assessmentOwaspTaxonomyVersion: string;
      owaspCategoryCode?: string;
    };
  };
  assert.equal(patchJson.data.id, primaryThreatId);
  assert.equal(patchJson.data.title, 'Missing server-side authorization');
  assert.equal(patchJson.data.status, 'mitigated');
  assert.equal(
    patchJson.data.assessmentOwaspTaxonomyVersion,
    OWASP_TOP_10_CURRENT_VERSION,
  );
  assert.equal(patchJson.data.risk, 'Risk reduced after remediation');
  assert.equal(patchJson.data.owaspCategoryCode, 'A09:2025');

  const invalidPatchResponse = await fetch(
    `${server.baseUrl}/api/threats/${primaryThreatId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Missing server-side authorization',
        owaspCategoryCode: 'A09:2021',
      }),
    },
  );
  assert.equal(invalidPatchResponse.status, 400);
  const invalidPatchJson = (await invalidPatchResponse.json()) as {
    error: {
      code: string;
      details: Array<{ path: string }>;
    };
  };
  assert.equal(invalidPatchJson.error.code, 'VALIDATION_ERROR');
  assert.equal(
    invalidPatchJson.error.details.some(
      detail => detail.path === 'owaspCategoryCode',
    ),
    true,
  );

  const postPatchGetResponse = await fetch(
    `${server.baseUrl}/api/threats/${primaryThreatId}`,
  );
  assert.equal(postPatchGetResponse.status, 200);
  const postPatchGetJson = (await postPatchGetResponse.json()) as {
    data: {
      id: string;
      title: string;
      assessmentOwaspTaxonomyVersion: string;
      owaspCategoryCode?: string;
    };
  };
  assert.equal(postPatchGetJson.data.id, primaryThreatId);
  assert.equal(
    postPatchGetJson.data.title,
    'Missing server-side authorization',
  );
  assert.equal(
    postPatchGetJson.data.assessmentOwaspTaxonomyVersion,
    OWASP_TOP_10_CURRENT_VERSION,
  );
  assert.equal(postPatchGetJson.data.owaspCategoryCode, 'A09:2025');

  const deleteSecondaryResponse = await fetch(
    `${server.baseUrl}/api/threats/${secondaryThreat.id}`,
    {
      method: 'DELETE',
    },
  );
  assert.equal(deleteSecondaryResponse.status, 204);
  assert.equal(await deleteSecondaryResponse.text(), '');

  await assert.rejects(
    threatRepository.create({
      assessmentId: 'asm_00000000-0000-0000-0000-000000000099',
      title: 'Broken foreign key',
      description: 'Should fail because the assessment does not exist.',
      severity: 'high',
      strideCategories: ['spoofing'],
      status: 'open',
      affectedAsset: undefined,
      impact: undefined,
      recommendation: undefined,
      observation: undefined,
      affectedComponent: undefined,
      affectedEndpoint: undefined,
      risk: undefined,
    }),
    error => error instanceof RepositoryNotFoundError,
  );

  const evidence = await evidenceRepository.create({
    assessmentId: primaryAssessment.id,
    threatIds: [primaryThreatId],
    type: 'note',
    title: 'Threat evidence',
    description: 'Evidence linked to the threat',
    content: 'payload',
    fileName: undefined,
    filePath: undefined,
    mimeType: undefined,
    capturedAt: '2026-06-02',
  });

  const report = await reportRepository.create({
    assessmentId: primaryAssessment.id,
    title: 'Threat report',
    status: 'draft',
    latestVersion: 1,
    executiveSummary: 'Summary',
    selectedThreatIds: [primaryThreatId],
  });

  assert.deepEqual(evidence.threatIds, [primaryThreatId]);
  assert.deepEqual(report.selectedThreatIds, [primaryThreatId]);

  const deleteConflictResponse = await fetch(
    `${server.baseUrl}/api/threats/${primaryThreatId}`,
    {
      method: 'DELETE',
    },
  );
  assert.equal(deleteConflictResponse.status, 409);
  const deleteConflictJson = (await deleteConflictResponse.json()) as {
    error: { code: string; message: string; details: [] };
  };
  assert.deepEqual(deleteConflictJson, {
    error: {
      code: 'THREAT_DELETE_CONFLICT',
      message:
        'Threat cannot be deleted while related evidence or reports exist',
      details: [],
    },
  });

  const missingAssessmentResponse = await fetch(
    `${server.baseUrl}/api/threats`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assessmentId: 'asm_00000000-0000-0000-0000-000000000098',
        title: 'Missing assessment threat',
        description: 'Should be blocked before create.',
        severity: 'high',
        strideCategories: ['spoofing'],
        status: 'open',
      }),
    },
  );
  assert.equal(missingAssessmentResponse.status, 404);
  const missingAssessmentJson = (await missingAssessmentResponse.json()) as {
    error: { code: string; message: string; details: [] };
  };
  assert.deepEqual(missingAssessmentJson, {
    error: {
      code: 'ASSESSMENT_NOT_FOUND',
      message: 'Assessment not found',
      details: [],
    },
  });
};

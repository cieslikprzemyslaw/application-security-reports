import assert from 'node:assert/strict';

import {
  startTestServer,
  readJson,
  defaultCompany,
  defaultAssessment,
  createAssessmentRepository,
  createCompanyRepository,
  createApp,
  type ApiErrorBody,
} from './support.js';

for (const [field, body] of [
  ['id', { id: 'asm_client_controlled' }],
  ['companyId', { companyId: defaultCompany.id }],
  ['createdAt', { createdAt: '2026-06-12T00:00:00.000Z' }],
  ['updatedAt', { updatedAt: '2026-06-12T00:00:00.000Z' }],
  ['applicationName', { applicationName: '   ' }],
] as const) {
  const { calls, repository } = createAssessmentRepository();
  const { repository: companyRepository } = createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/assessments/${defaultAssessment.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    assert.equal(response.status, 400);
    assert.equal(calls.update, 0);
    const responseBody = await readJson<ApiErrorBody>(response);
    assert.equal(responseBody.error.code, 'VALIDATION_ERROR');
    assert.ok(
      responseBody.error.details.some(
        detail =>
          detail.path === field &&
          detail.message.includes(
            field === 'applicationName'
              ? 'Text is required'
              : 'Unknown property',
          ),
      ),
    );
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createAssessmentRepository();
  const { repository: companyRepository } = createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/assessments/${defaultAssessment.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      },
    );

    assert.equal(response.status, 400);
    assert.equal(calls.update, 0);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(
      body.error.details.some(detail =>
        detail.message.includes('At least one assessment field is required'),
      ),
    );
  } finally {
    await server.close();
  }
}

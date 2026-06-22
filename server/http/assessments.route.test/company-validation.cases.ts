import assert from 'node:assert/strict';
import { OWASP_TOP_10_CURRENT_VERSION } from '../../../src/domain/owaspTop10.js';

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

{
  const { calls, repository } = createAssessmentRepository();
  const { calls: companyCalls, repository: companyRepository } =
    createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(`${server.baseUrl}/api/assessments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companyId: defaultCompany.id,
        title: 'Example Assessment',
        applicationName: 'Example Assessment',
        status: 'draft',
      }),
    });

    assert.equal(response.status, 201);
    assert.equal(companyCalls.findById, 1);
    assert.equal(
      response.headers.get('location'),
      `/api/assessments/${defaultAssessment.id}`,
    );
    const body = await readJson<{ data: typeof defaultAssessment }>(response);
    assert.equal(body.data.id.startsWith('asm_'), true);
    assert.equal(body.data.title, 'Example Assessment');
    assert.equal(body.data.owaspTaxonomyVersion, OWASP_TOP_10_CURRENT_VERSION);
    assert.equal(calls.create, 1);
    assert.equal(calls.createArgs?.input.companyId, defaultCompany.id);
    assert.equal(
      (calls.createArgs?.input as { owaspTaxonomyVersion?: string } | undefined)
        ?.owaspTaxonomyVersion,
      undefined,
    );
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createAssessmentRepository();
  const { calls: companyCalls, repository: companyRepository } =
    createCompanyRepository({
      findById: async () => null,
    });
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(`${server.baseUrl}/api/assessments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companyId: defaultCompany.id,
        title: 'Example Assessment',
        applicationName: 'Example Assessment',
        status: 'draft',
      }),
    });

    assert.equal(response.status, 404);
    assert.equal(calls.create, 0);
    assert.equal(companyCalls.findById, 1);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'COMPANY_NOT_FOUND',
        message: 'Company not found',
        details: [],
      },
    });
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
    const response = await fetch(`${server.baseUrl}/api/assessments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'asm_client_controlled',
        companyId: defaultCompany.id,
        title: 'Example Assessment',
        applicationName: 'Example Assessment',
        status: 'draft',
      }),
    });

    assert.equal(response.status, 400);
    assert.equal(calls.create, 0);
    assert.deepEqual(await readJson(response), {
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
    const response = await fetch(`${server.baseUrl}/api/assessments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companyId: defaultCompany.id,
        title: '',
        applicationName: 'Example Assessment',
        status: 'draft',
      }),
    });

    assert.equal(response.status, 400);
    assert.equal(calls.create, 0);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(
      body.error.details.some(
        detail =>
          detail.path === 'title' &&
          detail.message.includes('Text is required'),
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
    const response = await fetch(`${server.baseUrl}/api/assessments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companyId: defaultCompany.id,
        title: 'Example Assessment',
        applicationName: 'Example Assessment',
        status: 'draft',
        unknown: true,
      }),
    });

    assert.equal(response.status, 400);
    assert.equal(calls.create, 0);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(
      body.error.details.some(
        detail =>
          detail.path === 'unknown' &&
          detail.message.includes('Unknown property'),
      ),
    );
  } finally {
    await server.close();
  }
}

import assert from 'node:assert/strict';
import { OWASP_TOP_10_CURRENT_VERSION } from '../../../src/domain/owaspTop10.js';

import {
  RepositoryConstraintError,
  RepositoryNotFoundError,
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
  const { repository } = createAssessmentRepository({
    create: async () => {
      throw new Error('boom');
    },
  });
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
        status: 'draft',
      }),
    });

    assert.equal(response.status, 500);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'INTERNAL_SERVER_ERROR');
    assert.equal(JSON.stringify(body).includes('boom'), false);
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createAssessmentRepository({
    update: async (_id, input) => ({
      ...defaultAssessment,
      ...input,
    }),
  });
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
        body: JSON.stringify({
          title: 'Updated Assessment',
          overallRisk: 'medium',
        }),
      },
    );

    assert.equal(response.status, 200);
    const body = await readJson<{ data: typeof defaultAssessment }>(response);
    assert.equal(body.data.title, 'Updated Assessment');
    assert.equal(body.data.overallRisk, 'medium');
    assert.equal(body.data.owaspTaxonomyVersion, OWASP_TOP_10_CURRENT_VERSION);
    assert.equal(calls.update, 1);
    assert.equal(calls.updateArgs?.id, defaultAssessment.id);
    assert.equal(calls.updateArgs?.input.title, 'Updated Assessment');
    assert.equal(
      (
        calls.updateArgs?.input as
          | {
              owaspTaxonomyVersion?: string;
            }
          | undefined
      )?.owaspTaxonomyVersion,
      undefined,
    );
  } finally {
    await server.close();
  }
}

for (const [field, body] of [
  ['id', { id: 'asm_client_controlled' }],
  ['companyId', { companyId: defaultCompany.id }],
  ['createdAt', { createdAt: '2026-06-12T00:00:00.000Z' }],
  ['updatedAt', { updatedAt: '2026-06-12T00:00:00.000Z' }],
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
          detail.path === field && detail.message.includes('Unknown property'),
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

{
  const { calls, repository } = createAssessmentRepository({
    update: async () => {
      throw new RepositoryNotFoundError();
    },
  });
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
        body: JSON.stringify({
          title: 'Updated Assessment',
        }),
      },
    );

    assert.equal(response.status, 404);
    assert.equal(calls.update, 1);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'ASSESSMENT_NOT_FOUND',
        message: 'Assessment not found',
        details: [],
      },
    });
  } finally {
    await server.close();
  }
}

{
  const { repository } = createAssessmentRepository({
    update: async () => {
      throw new Error('boom');
    },
  });
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
        body: JSON.stringify({
          title: 'Updated Assessment',
        }),
      },
    );

    assert.equal(response.status, 500);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'INTERNAL_SERVER_ERROR');
    assert.equal(JSON.stringify(body).includes('boom'), false);
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createAssessmentRepository({
    delete: async () => undefined,
  });
  const { repository: companyRepository } = createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/assessments/${defaultAssessment.id}`,
      {
        method: 'DELETE',
      },
    );

    assert.equal(response.status, 204);
    assert.equal(await response.text(), '');
    assert.equal(calls.delete, 1);
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createAssessmentRepository({
    delete: async () => {
      throw new RepositoryNotFoundError();
    },
  });
  const { repository: companyRepository } = createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/assessments/${defaultAssessment.id}`,
      {
        method: 'DELETE',
      },
    );

    assert.equal(response.status, 404);
    assert.equal(calls.delete, 1);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'ASSESSMENT_NOT_FOUND',
        message: 'Assessment not found',
        details: [],
      },
    });
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createAssessmentRepository({
    delete: async () => {
      throw new RepositoryConstraintError();
    },
  });
  const { repository: companyRepository } = createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/assessments/${defaultAssessment.id}`,
      {
        method: 'DELETE',
      },
    );

    assert.equal(response.status, 409);
    assert.equal(calls.delete, 1);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'ASSESSMENT_DELETE_CONFLICT',
        message: 'Assessment cannot be deleted while related reports exist',
        details: [],
      },
    });
  } finally {
    await server.close();
  }
}

{
  const { repository } = createAssessmentRepository({
    delete: async () => {
      throw new Error('boom');
    },
  });
  const { repository: companyRepository } = createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/assessments/${defaultAssessment.id}`,
      {
        method: 'DELETE',
      },
    );

    assert.equal(response.status, 500);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'INTERNAL_SERVER_ERROR');
    assert.equal(JSON.stringify(body).includes('boom'), false);
  } finally {
    await server.close();
  }
}

console.log('assessments API route checks passed');

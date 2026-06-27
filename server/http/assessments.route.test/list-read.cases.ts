import assert from 'node:assert/strict';

import {
  startTestServer,
  readJson,
  defaultCompany,
  defaultAssessment,
  createAssessmentRepository,
  createCompanyRepository,
  createApp,
} from './support.js';

{
  const { calls, repository } = createAssessmentRepository({
    findAll: async () => [defaultAssessment],
  });
  const { repository: companyRepository } = createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(`${server.baseUrl}/api/assessments`);

    assert.equal(response.status, 200);
    assert.deepEqual(
      await readJson<{ data: Array<typeof defaultAssessment> }>(response),
      {
        data: [defaultAssessment],
      },
    );
    assert.equal(calls.findAll, 1);
    assert.equal(calls.findByCompanyId, 0);
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createAssessmentRepository({
    findByCompanyId: async () => [defaultAssessment],
  });
  const { repository: companyRepository } = createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/assessments?companyId=${defaultCompany.id}`,
    );

    assert.equal(response.status, 200);
    assert.deepEqual(
      await readJson<{ data: Array<typeof defaultAssessment> }>(response),
      {
        data: [defaultAssessment],
      },
    );
    assert.equal(calls.findAll, 0);
    assert.equal(calls.findByCompanyId, 1);
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createAssessmentRepository({
    findById: async () => defaultAssessment,
  });
  const { repository: companyRepository } = createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/assessments/${defaultAssessment.id}`,
    );

    assert.equal(response.status, 200);
    assert.deepEqual(
      await readJson<{ data: typeof defaultAssessment }>(response),
      {
        data: defaultAssessment,
      },
    );
    assert.equal(calls.findById, 1);
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createAssessmentRepository({
    findById: async () => ({
      ...defaultAssessment,
      applicationName: null,
    }),
  });
  const { repository: companyRepository } = createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/assessments/${defaultAssessment.id}`,
    );

    assert.equal(response.status, 200);
    const body = await readJson<{
      data: typeof defaultAssessment & { applicationName: string | null };
    }>(response);
    assert.equal(body.data.applicationName, null);
    assert.equal(calls.findById, 1);
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createAssessmentRepository({
    findById: async () => null,
  });
  const { repository: companyRepository } = createCompanyRepository();
  const server = await startTestServer(
    createApp(repository, companyRepository),
  );

  try {
    const response = await fetch(
      `${server.baseUrl}/api/assessments/${defaultAssessment.id}`,
    );

    assert.equal(response.status, 404);
    assert.equal(calls.findById, 1);
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

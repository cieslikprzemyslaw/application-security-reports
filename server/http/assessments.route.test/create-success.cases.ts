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
} from './support.js';

{
  const { calls, repository } = createAssessmentRepository({
    create: async input => ({
      ...defaultAssessment,
      ...input,
    }),
  });
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
        status: 'draft',
        applicationName: ' Customer Website ',
      }),
    });

    assert.equal(response.status, 201);
    assert.equal(
      response.headers.get('location'),
      `/api/assessments/${defaultAssessment.id}`,
    );
    const body = await readJson<{ data: typeof defaultAssessment }>(response);
    assert.equal(body.data.applicationName, 'Customer Website');
    assert.equal(calls.create, 1);
    assert.equal(companyCalls.findById, 1);
    assert.equal(calls.createArgs?.input.applicationName, 'Customer Website');
  } finally {
    await server.close();
  }
}

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

import assert from 'node:assert/strict';
import { OWASP_TOP_10_CURRENT_VERSION } from '../../../src/domain/owaspTop10.js';

import {
  startTestServer,
  readJson,
  defaultAssessment,
  createAssessmentRepository,
  createCompanyRepository,
  createApp,
} from './support.js';

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
          applicationName: ' Customer Services Portal Public Site ',
          overallRisk: 'medium',
        }),
      },
    );

    assert.equal(response.status, 200);
    const body = await readJson<{
      data: typeof defaultAssessment & { availableActions: string[] };
    }>(response);
    assert.equal(body.data.title, 'Updated Assessment');
    assert.equal(
      body.data.applicationName,
      'Customer Services Portal Public Site',
    );
    assert.equal(body.data.overallRisk, 'medium');
    assert.equal(body.data.owaspTaxonomyVersion, OWASP_TOP_10_CURRENT_VERSION);
    assert.equal(calls.update, 1);
    assert.equal(calls.updateArgs?.id, defaultAssessment.id);
    assert.equal(calls.updateArgs?.input.title, 'Updated Assessment');
    assert.equal(
      calls.updateArgs?.input.applicationName,
      'Customer Services Portal Public Site',
    );
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

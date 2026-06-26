import assert from 'node:assert/strict';

import {
  startTestServer,
  readJson,
  createCompanyRepository,
  createApp,
} from './support.js';

{
  const { calls, repository } = createCompanyRepository();
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(`${server.baseUrl}/api/companies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{',
    });

    assert.equal(response.status, 400);
    assert.equal(calls.create, 0);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'INVALID_JSON',
        message: 'Malformed JSON request body',
        details: [],
      },
    });
  } finally {
    await server.close();
  }
}

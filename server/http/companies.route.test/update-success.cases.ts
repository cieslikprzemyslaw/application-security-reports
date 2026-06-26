import assert from 'node:assert/strict';

import {
  startTestServer,
  readJson,
  defaultCompany,
  defaultCompanyResponse,
  createCompanyRepository,
  createApp,
} from './support.js';

{
  const { calls, repository } = createCompanyRepository({
    update: async (_id, input) => ({
      ...defaultCompany,
      ...input,
    }),
  });
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Northstar Security',
        }),
      },
    );

    assert.equal(response.status, 200);
    const body = await readJson<{ data: typeof defaultCompanyResponse }>(
      response,
    );
    assert.equal(body.data.name, 'Northstar Security');
    assert.equal(body.data.website, defaultCompany.website);
    assert.equal(body.data.logoUrl, defaultCompanyResponse.logoUrl);
    assert.equal(calls.update, 1);
    assert.equal(calls.updateArgs?.id, defaultCompany.id);
    assert.equal(calls.updateArgs?.input.name, 'Northstar Security');
  } finally {
    await server.close();
  }
}

{
  const { calls, repository } = createCompanyRepository({
    update: async (_id, input) => ({
      ...defaultCompany,
      ...input,
      website: 'https://northstar.example',
    }),
  });
  const server = await startTestServer(createApp(repository));

  try {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${defaultCompany.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Northstar Security',
          contactEmail: 'security-team@example.com',
        }),
      },
    );

    assert.equal(response.status, 200);
    const body = await readJson<{ data: typeof defaultCompanyResponse }>(
      response,
    );
    assert.equal(body.data.name, 'Northstar Security');
    assert.equal(body.data.contactEmail, 'security-team@example.com');
    assert.equal(body.data.logoUrl, defaultCompanyResponse.logoUrl);
    assert.equal(calls.update, 1);
    assert.equal(calls.updateArgs?.input.name, 'Northstar Security');
    assert.equal(
      calls.updateArgs?.input.contactEmail,
      'security-team@example.com',
    );
  } finally {
    await server.close();
  }
}

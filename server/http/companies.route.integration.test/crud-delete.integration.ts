import assert from 'node:assert/strict';

import { createCompanyRepository } from '../../database/repositories/company.repository.js';
import { createIntegrationDatabase, startCompanyApiServer } from './helpers.js';

const database = await createIntegrationDatabase('appsec-companies-');

try {
  const repository = createCompanyRepository(database.prisma);
  const server = await startCompanyApiServer({
    companyRepository: repository,
  });

  try {
    const createResponse = await fetch(server.baseUrl + '/api/companies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Northstar Digital',
        description: 'Security consulting and managed assessment services',
        website: 'https://northstar.example',
        contactName: 'Alex Mercer',
        contactEmail: 'security@northstar.example',
        footerText: 'Confidential - do not distribute.',
      }),
    });

    assert.equal(createResponse.status, 201);
    const createdJson = (await createResponse.json()) as {
      data: {
        id: string;
        name: string;
        logoUrl: string | null;
        createdAt: string;
        updatedAt: string;
      };
    };
    assert.equal(createdJson.data.id.startsWith('cmp_'), true);
    assert.equal(createdJson.data.name, 'Northstar Digital');
    assert.equal(createdJson.data.logoUrl, null);

    const companyId = createdJson.data.id;

    const listResponse = await fetch(server.baseUrl + '/api/companies');
    assert.equal(listResponse.status, 200);
    const listJson = (await listResponse.json()) as {
      data: Array<{ id: string; name: string }>;
    };
    assert.equal(listJson.data.length, 1);
    assert.equal(listJson.data[0]?.id, companyId);

    const getResponse = await fetch(
      server.baseUrl + '/api/companies/' + companyId,
    );
    assert.equal(getResponse.status, 200);
    const getJson = (await getResponse.json()) as {
      data: {
        id: string;
        name: string;
        website?: string;
        logoUrl: string | null;
      };
    };
    assert.equal(getJson.data.id, companyId);
    assert.equal(getJson.data.website, 'https://northstar.example');
    assert.equal(getJson.data.logoUrl, null);

    const patchResponse = await fetch(
      server.baseUrl + '/api/companies/' + companyId,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Northstar Security',
          footerText: 'Confidential - updated.',
        }),
      },
    );
    assert.equal(patchResponse.status, 200);
    const patchJson = (await patchResponse.json()) as {
      data: {
        id: string;
        name: string;
        footerText?: string;
        logoUrl: string | null;
      };
    };
    assert.equal(patchJson.data.id, companyId);
    assert.equal(patchJson.data.name, 'Northstar Security');
    assert.equal(patchJson.data.footerText, 'Confidential - updated.');
    assert.equal(patchJson.data.logoUrl, null);

    const deleteResponse = await fetch(
      server.baseUrl + '/api/companies/' + companyId,
      { method: 'DELETE' },
    );
    assert.equal(deleteResponse.status, 204);
    assert.equal(await deleteResponse.text(), '');

    const missingAfterDelete = await fetch(
      server.baseUrl + '/api/companies/' + companyId,
    );
    assert.equal(missingAfterDelete.status, 404);

    const blockedCompany = await repository.create({
      name: 'Blocked Partner',
      description: undefined,
      website: undefined,
      contactName: undefined,
      contactEmail: undefined,
      footerText: undefined,
    });

    await database.prisma.assessment.create({
      data: {
        id: 'asm_00000000-0000-0000-0000-000000000001',
        companyId: blockedCompany.id,
        title: 'Blocked delete assessment',
        status: 'draft',
      },
    });

    const blockedDeleteResponse = await fetch(
      server.baseUrl + '/api/companies/' + blockedCompany.id,
      { method: 'DELETE' },
    );
    assert.equal(blockedDeleteResponse.status, 409);
    const blockedDeleteJson = (await blockedDeleteResponse.json()) as {
      error: { code: string; message: string; details: [] };
    };
    assert.deepEqual(blockedDeleteJson, {
      error: {
        code: 'COMPANY_DELETE_CONFLICT',
        message: 'Company cannot be deleted while related assessments exist',
        details: [],
      },
    });
  } finally {
    await server.close();
  }
} finally {
  await database.cleanup();
}

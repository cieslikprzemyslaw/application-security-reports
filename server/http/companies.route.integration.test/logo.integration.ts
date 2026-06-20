import assert from 'node:assert/strict';
import { rm } from 'node:fs/promises';
import path from 'node:path';

import { createCompanyRepository } from '../../database/repositories/company.repository.js';
import { createCompanyLogoStorage } from '../../services/companyLogoStorage.js';
import { createIntegrationDatabase, startCompanyApiServer } from './helpers.js';

const database = await createIntegrationDatabase('appsec-logo-integration-');
let logoCompanyId: string | undefined;

try {
  const logoRepository = createCompanyRepository(database.prisma);
  const logoStorage = createCompanyLogoStorage();
  const server = await startCompanyApiServer({
    companyRepository: logoRepository,
    logoStorage,
  });

  try {
    const createResp = await fetch(server.baseUrl + '/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Logo Test Corp',
        description: undefined,
        website: undefined,
        contactName: undefined,
        contactEmail: undefined,
        footerText: undefined,
      }),
    });
    assert.equal(createResp.status, 201);
    const createJson = (await createResp.json()) as {
      data: { id: string; logoUrl: string | null };
    };
    logoCompanyId = createJson.data.id;
    assert.equal(createJson.data.logoUrl, null);

    const pngBytes = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);

    const putResp = await fetch(
      server.baseUrl + '/api/companies/' + logoCompanyId + '/logo',
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/png',
          'X-File-Name': 'logo.png',
        },
        body: pngBytes,
      },
    );
    assert.equal(putResp.status, 200);
    const putJson = (await putResp.json()) as {
      data: { id: string; logoUrl: string | null };
    };
    assert.equal(putJson.data.id, logoCompanyId);
    assert.ok(
      typeof putJson.data.logoUrl === 'string' &&
        putJson.data.logoUrl.includes(
          '/api/companies/' + logoCompanyId + '/logo',
        ),
    );

    const getResp = await fetch(
      server.baseUrl + '/api/companies/' + logoCompanyId + '/logo',
    );
    assert.equal(getResp.status, 200);
    assert.ok(getResp.headers.get('content-type')?.startsWith('image/png'));
    const gotBytes = Buffer.from(await getResp.arrayBuffer());
    assert.deepEqual(gotBytes, pngBytes);

    const getCompanyResp = await fetch(
      server.baseUrl + '/api/companies/' + logoCompanyId,
    );
    assert.equal(getCompanyResp.status, 200);
    const getCompanyJson = (await getCompanyResp.json()) as {
      data: { logoUrl: string | null };
    };
    assert.ok(
      typeof getCompanyJson.data.logoUrl === 'string' &&
        getCompanyJson.data.logoUrl.startsWith('http'),
    );

    const deleteResp = await fetch(
      server.baseUrl + '/api/companies/' + logoCompanyId + '/logo',
      { method: 'DELETE' },
    );
    assert.equal(deleteResp.status, 204);
    assert.equal(await deleteResp.text(), '');

    const getAfterDeleteResp = await fetch(
      server.baseUrl + '/api/companies/' + logoCompanyId + '/logo',
    );
    assert.equal(getAfterDeleteResp.status, 404);
    const getAfterDeleteJson = (await getAfterDeleteResp.json()) as {
      error: { code: string };
    };
    assert.equal(getAfterDeleteJson.error.code, 'COMPANY_LOGO_NOT_FOUND');

    const secondDeleteResp = await fetch(
      server.baseUrl + '/api/companies/' + logoCompanyId + '/logo',
      { method: 'DELETE' },
    );
    assert.equal(secondDeleteResp.status, 204);
  } finally {
    await server.close();
  }
} finally {
  await database.cleanup();

  if (logoCompanyId) {
    const logoDir = path.join(
      process.cwd(),
      'uploads',
      'company-logos',
      logoCompanyId,
    );
    await rm(logoDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

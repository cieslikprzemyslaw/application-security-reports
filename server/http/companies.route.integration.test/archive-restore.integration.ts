import assert from 'node:assert/strict';

import { createCompanyRepository } from '../../database/repositories/company.repository.js';
import { createIntegrationDatabase, startCompanyApiServer } from './helpers.js';

const database = await createIntegrationDatabase('appsec-companies-archive-');

try {
  const repository = createCompanyRepository(database.prisma);
  const server = await startCompanyApiServer({ companyRepository: repository });

  try {
    const createResponse = await fetch(server.baseUrl + '/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Archive Test Corp' }),
    });
    assert.equal(createResponse.status, 201);
    const created = (await createResponse.json()) as {
      data: { id: string; archivedAt: string | null };
    };
    const companyId = created.data.id;
    assert.equal(created.data.archivedAt, null);

    // Company appears in default list before archive
    const listBefore = (await (
      await fetch(server.baseUrl + '/api/companies')
    ).json()) as { data: Array<{ id: string }> };
    assert.equal(
      listBefore.data.some(c => c.id === companyId),
      true,
    );

    // Archive the company
    const archiveResponse = await fetch(
      server.baseUrl + '/api/companies/' + companyId + '/archive',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{}',
      },
    );
    assert.equal(archiveResponse.status, 200);
    const archiveJson = (await archiveResponse.json()) as {
      data: { id: string; archivedAt: string | null };
    };
    assert.equal(archiveJson.data.id, companyId);
    assert.equal(typeof archiveJson.data.archivedAt, 'string');

    // Archived company no longer appears in default list
    const listAfterArchive = (await (
      await fetch(server.baseUrl + '/api/companies')
    ).json()) as { data: Array<{ id: string }> };
    assert.equal(
      listAfterArchive.data.some(c => c.id === companyId),
      false,
    );

    // Archived company still retrievable by ID
    const getArchived = await fetch(
      server.baseUrl + '/api/companies/' + companyId,
    );
    assert.equal(getArchived.status, 200);
    const getArchivedJson = (await getArchived.json()) as {
      data: { archivedAt: string | null };
    };
    assert.equal(typeof getArchivedJson.data.archivedAt, 'string');

    // Repeat archive returns 409 COMPANY_ALREADY_ARCHIVED
    const repeatArchive = await fetch(
      server.baseUrl + '/api/companies/' + companyId + '/archive',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{}',
      },
    );
    assert.equal(repeatArchive.status, 409);
    const repeatArchiveJson = (await repeatArchive.json()) as {
      error: { code: string };
    };
    assert.equal(repeatArchiveJson.error.code, 'COMPANY_ALREADY_ARCHIVED');

    // Restore the company
    const restoreResponse = await fetch(
      server.baseUrl + '/api/companies/' + companyId + '/restore',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{}',
      },
    );
    assert.equal(restoreResponse.status, 200);
    const restoreJson = (await restoreResponse.json()) as {
      data: { id: string; archivedAt: string | null };
    };
    assert.equal(restoreJson.data.id, companyId);
    assert.equal(restoreJson.data.archivedAt, null);

    // Restored company appears in default list again
    const listAfterRestore = (await (
      await fetch(server.baseUrl + '/api/companies')
    ).json()) as { data: Array<{ id: string }> };
    assert.equal(
      listAfterRestore.data.some(c => c.id === companyId),
      true,
    );

    // Repeat restore on active company returns 409 COMPANY_NOT_ARCHIVED
    const repeatRestore = await fetch(
      server.baseUrl + '/api/companies/' + companyId + '/restore',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{}',
      },
    );
    assert.equal(repeatRestore.status, 409);
    const repeatRestoreJson = (await repeatRestore.json()) as {
      error: { code: string };
    };
    assert.equal(repeatRestoreJson.error.code, 'COMPANY_NOT_ARCHIVED');

    // Archive/restore on non-existent company returns 404
    const missingId = 'cmp_00000000-0000-0000-0000-000000000099';
    const archiveMissing = await fetch(
      server.baseUrl + '/api/companies/' + missingId + '/archive',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{}',
      },
    );
    assert.equal(archiveMissing.status, 404);

    const restoreMissing = await fetch(
      server.baseUrl + '/api/companies/' + missingId + '/restore',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{}',
      },
    );
    assert.equal(restoreMissing.status, 404);
  } finally {
    await server.close();
  }
} finally {
  await database.cleanup();
}

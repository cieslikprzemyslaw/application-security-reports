import { createServer, type Server } from 'node:http';

import { afterEach, describe, expect, it } from 'vitest';

import { createAssessmentTemplateRepository } from '../database/repositories/assessmentTemplate.repository.js';
import { createTemporaryDatabase } from '../test/temporaryDatabase.js';
import { createApiApp } from './api-app.js';

const resources: Array<{
  cleanup: () => Promise<void>;
  server: Server;
}> = [];

afterEach(async () => {
  await Promise.all(
    resources.splice(0).map(async resource => {
      await new Promise<void>((resolve, reject) => {
        resource.server.close(error => (error ? reject(error) : resolve()));
      });
      await resource.cleanup();
    }),
  );
});

const createHarness = async () => {
  const database = await createTemporaryDatabase();
  const repository = createAssessmentTemplateRepository(database.prisma);
  const app = createApiApp(
    {
      apiPort: 3001,
      frontendOrigin: 'http://localhost:5173',
      nodeEnv: 'test',
    },
    { assessmentTemplateRepository: repository },
  );
  const server = createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Expected an ephemeral API port.');
  }

  resources.push({ server, cleanup: database.cleanup });

  return `http://127.0.0.1:${address.port}/api/assessment-templates`;
};

const requestJson = (url: string, init?: RequestInit) =>
  fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

const createBody = {
  name: 'Public application review',
  assessmentType: 'Web App',
  environment: 'Production',
  description: 'Reusable defaults',
  scope: 'Public and authenticated routes',
};

describe('Assessment Template API', () => {
  it('validates, creates, lists, updates, archives and restores', async () => {
    const baseUrl = await createHarness();

    const invalidResponse = await requestJson(baseUrl, {
      method: 'POST',
      body: JSON.stringify({ ...createBody, companyId: 'cmp_forbidden' }),
    });
    expect(invalidResponse.status).toBe(400);

    const createResponse = await requestJson(baseUrl, {
      method: 'POST',
      body: JSON.stringify(createBody),
    });
    expect(createResponse.status).toBe(201);
    const createdPayload = (await createResponse.json()) as {
      data: { id: string; name: string; archivedAt: string | null };
    };
    const templateId = createdPayload.data.id;

    const updateResponse = await requestJson(`${baseUrl}/${templateId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated review template' }),
    });
    expect(updateResponse.status).toBe(200);

    const archiveResponse = await requestJson(
      `${baseUrl}/${templateId}/archive`,
      { method: 'POST', body: JSON.stringify({}) },
    );
    expect(archiveResponse.status).toBe(200);
    const archiveAgainResponse = await requestJson(
      `${baseUrl}/${templateId}/archive`,
      { method: 'POST', body: JSON.stringify({}) },
    );
    expect(archiveAgainResponse.status).toBe(200);

    const activeList = (await (await requestJson(baseUrl)).json()) as {
      data: unknown[];
    };
    expect(activeList.data).toEqual([]);

    const fullList = (await (
      await requestJson(`${baseUrl}?includeArchived=true`)
    ).json()) as { data: Array<{ id: string; archivedAt: string | null }> };
    expect(fullList.data).toHaveLength(1);
    expect(fullList.data[0]?.archivedAt).toBeTruthy();

    const archivedUpdate = await requestJson(`${baseUrl}/${templateId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Should not persist' }),
    });
    expect(archivedUpdate.status).toBe(409);

    const restoreResponse = await requestJson(
      `${baseUrl}/${templateId}/restore`,
      { method: 'POST', body: JSON.stringify({}) },
    );
    expect(restoreResponse.status).toBe(200);

    const restored = (await (await requestJson(baseUrl)).json()) as {
      data: Array<{ id: string; name: string; archivedAt: string | null }>;
    };
    expect(restored.data).toEqual([
      expect.objectContaining({
        id: templateId,
        name: 'Updated review template',
        archivedAt: null,
      }),
    ]);
  });
});

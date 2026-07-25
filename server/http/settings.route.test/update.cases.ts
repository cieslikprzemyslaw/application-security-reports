import assert from 'node:assert/strict';

import {
  createSettingsRepositoryStub,
  defaultSettings,
  readJson,
  startSettingsTestServer,
  type ApiErrorBody,
} from './support.js';

const patchSettings = (baseUrl: string, body: unknown) =>
  fetch(`${baseUrl}/api/settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

export const runSettingsUpdateCases = async () => {
  {
    const { calls, repository } = createSettingsRepositoryStub({
      get: async () => defaultSettings,
      upsert: async input => ({
        ...defaultSettings,
        ...input,
        defaultReportTitle: 'Updated report title',
      }),
    });
    const server = await startSettingsTestServer(repository);

    try {
      const response = await patchSettings(server.baseUrl, {
        defaultReportTitle: 'Updated report title',
      });
      const body = await readJson<{ data: typeof defaultSettings }>(response);

      assert.equal(response.status, 200);
      assert.equal(body.data.defaultReportTitle, 'Updated report title');
      assert.equal(body.data.organisationName, defaultSettings.organisationName);
      assert.equal(calls.get, 1);
      assert.equal(calls.upsert, 1);
      assert.equal(calls.upsertArgs?.defaultReportTitle, 'Updated report title');
      assert.equal(
        calls.upsertArgs?.defaultSeverity,
        defaultSettings.defaultSeverity,
      );
    } finally {
      await server.close();
    }
  }

  for (const testCase of [
    {
      name: 'unsupported theme',
      body: { theme: 'solarized' },
      detail: 'theme',
    },
    { name: 'empty body', body: {}, detail: 'At least one settings field' },
    {
      name: 'unknown property',
      body: { notifications: true },
      detail: 'notifications',
    },
    {
      name: 'unsafe issuer logo id',
      body: { issuerLogoId: 'C:\\uploads\\issuer-logo.svg' },
      detail: 'issuerLogoId',
    },
  ]) {
    const { calls, repository } = createSettingsRepositoryStub();
    const server = await startSettingsTestServer(repository);

    try {
      const response = await patchSettings(server.baseUrl, testCase.body);
      const body = await readJson<ApiErrorBody>(response);

      assert.equal(response.status, 400, testCase.name);
      assert.equal(calls.upsert, 0, testCase.name);
      assert.equal(body.error.code, 'VALIDATION_ERROR', testCase.name);
      assert.equal(
        body.error.details.some(detail =>
          `${detail.path} ${detail.message}`.includes(testCase.detail),
        ),
        true,
        testCase.name,
      );
    } finally {
      await server.close();
    }
  }

  {
    const { calls, repository } = createSettingsRepositoryStub({
      get: async () => defaultSettings,
    });
    const server = await startSettingsTestServer(repository);

    try {
      const response = await patchSettings(server.baseUrl, {
        allowedBrandingModes: ['client'],
      });
      const body = await readJson<ApiErrorBody>(response);

      assert.equal(response.status, 400);
      assert.equal(calls.get, 1);
      assert.equal(calls.upsert, 0);
      assert.equal(body.error.code, 'VALIDATION_ERROR');
      assert.equal(
        body.error.details.some(
          detail =>
            detail.path === 'defaultBrandingMode' &&
            detail.message.includes('Default branding mode must be allowed'),
        ),
        true,
      );
    } finally {
      await server.close();
    }
  }
};

import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import {
  act,
  createJsonResponse,
  renderApp,
  restoreFetch,
  setFetch,
  waitFor,
} from '~/app/appRouter.tests/support';

const settings = {
  id: 'set_00000000-0000-0000-0000-000000000001',
  defaultSeverity: 'medium',
  theme: 'system',
  dateFormat: 'YYYY-MM-DD',
  includeEvidence: true,
  confidentialReports: true,
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
};

describe('Settings readiness target focus', () => {
  it('focuses Organisation name after the Settings request completes', async () => {
    setFetch(async input => {
      const path = String(input);

      if (path === '/api/companies') {
        return createJsonResponse({ data: [] });
      }

      if (path === '/api/settings') {
        return createJsonResponse({ data: settings });
      }

      throw new Error(`Unexpected request: ${path}`);
    });

    try {
      const { root } = await renderApp('/settings#organisationName');

      await waitFor(() => {
        const organisationName = document.getElementById('organisationName');

        assert.ok(organisationName);
        assert.equal(document.activeElement, organisationName);
      });

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  });
});

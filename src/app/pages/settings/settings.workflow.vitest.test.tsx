import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { act, fireEvent, waitFor } from '~/test/vitestLegacyBridge';
import {
  createJsonResponse,
  renderApp,
  renderTick,
  restoreFetch,
  routes,
  setFetch,
  textContent,
} from '~/app/appRouter.tests/support';

const settings = {
  id: 'set_00000000-0000-0000-0000-000000000001',
  organisationName: 'Northstar Digital',
  consultantName: 'Alex Mercer',
  consultantEmail: 'alex.mercer@appsec.io',
  defaultReportTitle: 'Application Security Assessment',
  defaultSeverity: 'medium',
  theme: 'system',
  dateFormat: 'YYYY-MM-DD',
  reportFooterText: 'Confidential - do not distribute.',
  reportConfidentialityLabel: 'Confidential',
  methodology: 'OWASP ASVS / WSTG',
  reportStyle: 'Technical & structured',
  includeEvidence: true,
  confidentialReports: true,
  allowedBrandingModes: ['issuer', 'client'],
  defaultBrandingMode: 'issuer',
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-11T09:00:00.000Z',
};

const unmount = async (root: { unmount: () => void }) => {
  await act(async () => {
    root.unmount();
  });
};

describe('Settings workflow through the production router', () => {
  it('keeps the route loading until Settings are confirmed', async () => {
    let resolveSettings: ((response: Response) => void) | undefined;
    const pending = new Promise<Response>(resolve => {
      resolveSettings = resolve;
    });

    setFetch(async input => {
      if (String(input) === '/api/settings') {
        return pending;
      }

      throw new Error(`Unexpected request: ${String(input)}`);
    });

    try {
      const { container, root } = await renderApp(routes.settings, false);

      await waitFor(() => {
        assert.ok(textContent(container).includes('Loading route content'));
      });

      await act(async () => {
        resolveSettings?.(createJsonResponse({ data: settings }));
        await renderTick();
        await renderTick();
      });

      await waitFor(() => {
        assert.ok(container.querySelector('.settings-form'));
        assert.ok(textContent(container).includes('Northstar Digital'));
      });

      await unmount(root);
    } finally {
      restoreFetch();
    }
  });

  it('renders a safe Settings load failure without a stale form', async () => {
    setFetch(async input => {
      if (String(input) === '/api/settings') {
        return createJsonResponse(
          {
            error: {
              code: 'SETTINGS_UNAVAILABLE',
              message: 'Settings unavailable.',
              details: [],
            },
          },
          { status: 500 },
        );
      }

      throw new Error(`Unexpected request: ${String(input)}`);
    });

    try {
      const { container, root } = await renderApp(routes.settings);

      await waitFor(() => {
        assert.ok(textContent(container).includes('Something went wrong'));
      });

      assert.equal(container.querySelector('.settings-form'), null);
      assert.equal(textContent(container).includes('Northstar Digital'), false);

      await unmount(root);
    } finally {
      restoreFetch();
    }
  });

  it('preserves edited values and dirty state after a failed save', async () => {
    let patchBody: Record<string, unknown> | undefined;

    setFetch(async (input, init) => {
      const path = String(input);
      const method = init?.method ?? 'GET';

      if (path !== '/api/settings') {
        throw new Error(`Unexpected request: ${path}`);
      }

      if (method === 'GET') {
        return createJsonResponse({ data: settings });
      }

      if (method === 'PATCH') {
        patchBody = JSON.parse(String(init?.body)) as Record<string, unknown>;

        return createJsonResponse(
          {
            error: {
              code: 'SETTINGS_UPDATE_FAILED',
              message: 'Unable to save settings.',
              details: [],
            },
          },
          { status: 500 },
        );
      }

      throw new Error(`Unexpected method: ${method}`);
    });

    try {
      const { container, root } = await renderApp(routes.settings);

      const consultantName = await waitFor(() => {
        const input = document.querySelector(
          '#consultantName',
        ) as HTMLInputElement | null;

        assert.ok(input, 'Expected consultantName field');
        return input;
      });

      await act(async () => {
        fireEvent.change(consultantName, {
          target: { value: 'Jordan Lee' },
        });
        await renderTick();
      });

      const saveButton = Array.from(container.querySelectorAll('button')).find(
        button => button.textContent?.includes('Save settings'),
      );

      assert.ok(saveButton, 'Expected Save settings action');

      await act(async () => {
        saveButton!.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
        await renderTick();
        await renderTick();
      });

      await waitFor(() => {
        assert.ok(textContent(container).includes('Unable to save settings.'));
        assert.ok(textContent(container).includes('You have unsaved changes.'));
      });

      assert.deepEqual(patchBody, { consultantName: 'Jordan Lee' });
      assert.equal(consultantName.value, 'Jordan Lee');
      assert.equal(textContent(container).includes('Settings saved.'), false);

      await unmount(root);
    } finally {
      restoreFetch();
    }
  });

  it('maps validation errors without discarding the edited field', async () => {
    setFetch(async (input, init) => {
      const method = init?.method ?? 'GET';

      if (String(input) !== '/api/settings') {
        throw new Error(`Unexpected request: ${String(input)}`);
      }

      if (method === 'GET') {
        return createJsonResponse({ data: settings });
      }

      return createJsonResponse(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: [
              {
                path: 'consultantEmail',
                message: 'Invalid email address',
                code: 'invalid_string',
              },
            ],
          },
        },
        { status: 400 },
      );
    });

    try {
      const { container, root } = await renderApp(routes.settings);
      const email = await waitFor(() => {
        const input = document.querySelector(
          '#consultantEmail',
        ) as HTMLInputElement | null;

        assert.ok(input, 'Expected consultantEmail field');
        return input;
      });

      await act(async () => {
        fireEvent.change(email, {
          target: { value: 'not-an-email' },
        });
      });

      const saveButton = Array.from(container.querySelectorAll('button')).find(
        button => button.textContent?.includes('Save settings'),
      );

      await act(async () => {
        saveButton?.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
        await renderTick();
        await renderTick();
      });

      await waitFor(() => {
        assert.ok(textContent(container).includes('Invalid email address'));
      });

      assert.equal(email.value, 'not-an-email');
      assert.equal(document.activeElement, email);

      await unmount(root);
    } finally {
      restoreFetch();
    }
  });
});

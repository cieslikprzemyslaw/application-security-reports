import { describe, it } from 'vitest';

import assert from 'node:assert/strict';

import {
  createTestDom,
  createTestingLibraryRoot,
  act,
  fireEvent,
  waitFor,
} from '~/test/vitestLegacyBridge';

import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { AppThemeProvider, themePreferenceStorageKey } from '~/theme';
import type { Settings } from '~/domain';

import SettingsRoute from './index';

describe('settings.controller', () => {
  it('passes the migrated checks', async () => {
    const renderTick = () =>
      new Promise<void>(resolve => setTimeout(resolve, 0));

    const originalFetch = globalThis.fetch;

    const setFetch = (value: typeof fetch) => {
      Object.defineProperty(globalThis, 'fetch', {
        value,
        configurable: true,
        writable: true,
      });
    };

    const restoreFetch = () => {
      setFetch(originalFetch);
    };

    const createJsonResponse = (
      body: unknown,
      init: ResponseInit = {},
    ): Response =>
      new Response(JSON.stringify(body), {
        headers: { 'Content-Type': 'application/json', ...init.headers },
        ...init,
      });

    const setGlobal = <K extends PropertyKey>(key: K, value: unknown) => {
      Object.defineProperty(globalThis, key, {
        value,
        configurable: true,
        writable: true,
      });
    };

    type TestWindow = Window & typeof globalThis;

    const setupDom = (
      localStorageEntries?: Record<string, string>,
    ): {
      container: HTMLElement;
      window: TestWindow;
    } => {
      const dom = createTestDom(
        '<!doctype html><html><body><div id="root"></div></body></html>',
        { url: 'http://localhost/' },
      );
      const { window } = dom;

      setGlobal('window', window);
      setGlobal('document', window.document);
      setGlobal('navigator', window.navigator);
      setGlobal('HTMLElement', window.HTMLElement);
      setGlobal('Node', window.Node);
      setGlobal(
        'requestAnimationFrame',
        window.requestAnimationFrame?.bind(window) ??
          ((callback: FrameRequestCallback) => window.setTimeout(callback, 16)),
      );
      setGlobal(
        'cancelAnimationFrame',
        window.cancelAnimationFrame?.bind(window) ??
          window.clearTimeout.bind(window),
      );
      setGlobal('IS_REACT_ACT_ENVIRONMENT', true);

      if (localStorageEntries) {
        for (const [key, value] of Object.entries(localStorageEntries)) {
          window.localStorage.setItem(key, value);
        }
      }

      Object.defineProperty(window, 'matchMedia', {
        value: () =>
          ({
            matches: false,
            media: '(prefers-color-scheme: dark)',
            onchange: null,
            addEventListener: () => undefined,
            removeEventListener: () => undefined,
            addListener: () => undefined,
            removeListener: () => undefined,
            dispatchEvent: () => false,
          }) as MediaQueryList,
        configurable: true,
        writable: true,
      });

      const container = window.document.getElementById('root');

      assert.ok(container, 'Expected root container to exist');

      return { container, window: window as unknown as TestWindow };
    };

    const renderComponent = async () => {
      const { container, window } = setupDom({
        [themePreferenceStorageKey]: 'light',
      });
      const root = createTestingLibraryRoot(container);
      const router = createMemoryRouter(
        [
          {
            path: '/settings',
            element: <SettingsRoute />,
          },
          {
            path: '/dashboard',
            element: <h1>Dashboard page</h1>,
          },
        ],
        {
          initialEntries: ['/settings'],
        },
      );

      await act(async () => {
        root.render(
          <AppThemeProvider>
            <RouterProvider router={router} />
          </AppThemeProvider>,
        );

        await renderTick();
        await renderTick();
      });

      return { container, root, router, window };
    };

    const findByLabel = (window: TestWindow, label: string) =>
      window.document.querySelector(
        `input#${label}, select#${label}, textarea#${label}`,
      ) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;

    const waitForField = async (window: TestWindow, label: string) =>
      waitFor(() => {
        const field = findByLabel(window, label);

        assert.ok(field, `Expected the ${label} field`);

        return field;
      });

    await (async () => {
      const baselineSettings: Settings = {
        id: 'settings_1',
        organisationName: 'Northstar Digital',
        consultantName: 'Alex Mercer',
        consultantRole: 'Lead Pentester',
        consultantEmail: 'alex.mercer@appsec.io',
        defaultReportTitle: 'Northstar Digital Security Assessment',
        defaultSeverity: 'medium',
        theme: 'system',
        dateFormat: 'YYYY-MM-DD',
        reportFooterText: 'Confidential - do not distribute.',
        methodology: 'OWASP ASVS / WSTG',
        reportStyle: 'Technical & structured',
        includeEvidence: true,
        confidentialReports: false,
        createdAt: '2026-06-10T00:00:00.000Z',
        updatedAt: '2026-06-11T00:00:00.000Z',
      };

      let requestCount = 0;
      let patchBody: Record<string, unknown> | undefined;

      setFetch(async (input, init) => {
        requestCount += 1;

        const method =
          input instanceof Request ? input.method : (init?.method ?? 'GET');

        if (method === 'GET') {
          return createJsonResponse({ data: baselineSettings });
        }

        if (method === 'PATCH') {
          patchBody =
            input instanceof Request
              ? ((await input.clone().json()) as Record<string, unknown>)
              : (JSON.parse(String(init?.body)) as Record<string, unknown>);

          return createJsonResponse({
            data: {
              ...baselineSettings,
              consultantName: 'Jordan Lee',
              theme: 'dark',
            },
          });
        }

        throw new Error(`Unexpected request method: ${method}`);
      });

      try {
        const { container, root, router, window } = await renderComponent();
        assert.equal(requestCount, 1);
        assert.equal(router.state.location.pathname, '/settings');

        const consultantNameInput = await waitForField(
          window,
          'consultantName',
        );
        const themeSelect = await waitForField(window, 'theme');

        await act(async () => {
          fireEvent.change(consultantNameInput!, {
            target: { value: 'Jordan Lee' },
          });
          fireEvent.change(themeSelect!, {
            target: { value: 'dark' },
          });
          await renderTick();
        });

        const saveButton = Array.from(
          container.querySelectorAll('button'),
        ).find(button => button.textContent?.includes('Save settings')) as
          | HTMLButtonElement
          | undefined;

        assert.ok(saveButton, 'Expected the save settings button');

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

        assert.deepEqual(patchBody, {
          consultantName: 'Jordan Lee',
          theme: 'dark',
        });
        assert.equal(
          window.localStorage.getItem(themePreferenceStorageKey),
          'dark',
        );
        assert.ok(container.textContent?.includes('Settings saved.'));

        await act(async () => {
          root.unmount();
        });
      } finally {
        restoreFetch();
      }
    })();

    await (async () => {
      setFetch(async () =>
        createJsonResponse({
          data: {
            id: 'settings_1',
            organisationName: 'Northstar Digital',
            consultantName: 'Alex Mercer',
            consultantRole: 'Lead Pentester',
            consultantEmail: 'alex.mercer@appsec.io',
            defaultReportTitle: 'Northstar Digital Security Assessment',
            defaultSeverity: 'medium',
            theme: 'system',
            dateFormat: 'YYYY-MM-DD',
            reportFooterText: 'Confidential - do not distribute.',
            methodology: 'OWASP ASVS / WSTG',
            reportStyle: 'Technical & structured',
            includeEvidence: true,
            confidentialReports: false,
            createdAt: '2026-06-10T00:00:00.000Z',
            updatedAt: '2026-06-11T00:00:00.000Z',
          },
        }),
      );

      try {
        const { container, root, router, window } = await renderComponent();
        const consultantNameInput = await waitForField(
          window,
          'consultantName',
        );

        await act(async () => {
          fireEvent.change(consultantNameInput!, {
            target: { value: 'Jordan Lee' },
          });
          await renderTick();
        });

        assert.ok(container.textContent?.includes('You have unsaved changes.'));

        const beforeUnloadEvent = new window.Event('beforeunload', {
          cancelable: true,
        }) as BeforeUnloadEvent;

        await act(async () => {
          window.dispatchEvent(beforeUnloadEvent);
          await renderTick();
        });

        assert.equal(beforeUnloadEvent.defaultPrevented, true);

        await act(async () => {
          await router.navigate('/dashboard');
          await renderTick();
        });

        assert.equal(router.state.location.pathname, '/settings');
        const keepEditingButton = Array.from(
          window.document.querySelectorAll<HTMLButtonElement>(
            '[role="dialog"] button',
          ),
        ).find(button => button.textContent?.includes('Keep editing'));
        assert.ok(keepEditingButton, 'Expected shared dirty-form dialog');

        await act(async () => {
          keepEditingButton!.dispatchEvent(
            new window.MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              button: 0,
            }),
          );
          await renderTick();
        });

        assert.equal(router.state.location.pathname, '/settings');
        assert.ok(container.textContent?.includes('Settings'));
        assert.ok(
          !container.textContent?.includes('Dashboard page'),
          'Expected navigation to stay on settings when the prompt is cancelled',
        );

        await act(async () => {
          void router.navigate('/dashboard');
          await renderTick();
        });

        const discardButton = Array.from(
          window.document.querySelectorAll<HTMLButtonElement>(
            '[role="dialog"] button',
          ),
        ).find(button => button.textContent?.includes('Discard changes'));
        assert.ok(discardButton, 'Expected discard action in shared dialog');

        await act(async () => {
          discardButton!.dispatchEvent(
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
          assert.equal(router.state.location.pathname, '/dashboard');
          assert.ok(container.textContent?.includes('Dashboard page'));
        });

        await act(async () => {
          root.unmount();
        });
      } finally {
        restoreFetch();
      }
    })();
  });
});

import { describe, it } from 'vitest';

import assert from 'node:assert/strict';

import {
  createTestDom,
  createTestingLibraryRoot,
  act,
} from '~/test/vitestLegacyBridge';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

import { formatReportVersion } from '~/app/utils/formatters';
import { defaultTheme } from '~/theme';
import packageJson from '../../../../package.json';

import AppLayout from './appLayout.component';

describe('appLayout', () => {
  it('passes the migrated checks', async () => {
    const renderTick = () =>
      new Promise<void>(resolve => setTimeout(resolve, 0));

    const setGlobal = <K extends PropertyKey>(key: K, value: unknown) => {
      Object.defineProperty(globalThis, key, {
        value,
        configurable: true,
        writable: true,
      });
    };

    const setupDom = (pathname: string) => {
      const dom = createTestDom(
        '<!doctype html><html><body><div id="root"></div></body></html>',
        { url: `http://localhost${pathname}` },
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

      return {
        container: window.document.getElementById('root'),
      };
    };

    const TestApp = () => (
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route
              path="/dashboard"
              element={<h1 className="test-page-title">Dashboard page</h1>}
            />
            <Route
              path="/companies"
              element={<h1 className="test-page-title">Companies page</h1>}
            />
            <Route
              path="*"
              element={
                <h1 className="test-page-title">Requested page not found</h1>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    );

    const renderApp = async (pathname: string) => {
      const { container } = setupDom(pathname);

      assert.ok(container, 'Expected root container to exist');

      const root = createTestingLibraryRoot(container);

      await act(async () => {
        root.render(
          <ThemeProvider theme={defaultTheme}>
            <TestApp />
          </ThemeProvider>,
        );
        await renderTick();
      });

      return { container, root };
    };

    await (async () => {
      {
        const { container, root } = await renderApp('/dashboard');

        assert.ok(container.querySelector('.sidebar'));
        assert.ok(container.querySelector('.topbar'));
        assert.ok(container.querySelector('.page-content'));
        assert.ok(
          textContent(container).includes(
            formatReportVersion(packageJson.version),
          ),
        );
        assert.ok(textContent(container).includes('Dashboard page'));
        assert.equal(
          container
            .querySelector('.app-shell-sidebar')
            ?.getAttribute('data-is-open'),
          'false',
        );

        await act(async () => {
          root.unmount();
        });
      }

      {
        const { container, root } = await renderApp('/dashboard');
        const openButton = container.querySelector(
          'button[aria-label="Open navigation menu"]',
        ) as HTMLButtonElement | null;

        assert.ok(openButton, 'Expected mobile menu button');
        assert.equal(
          openButton?.getAttribute('aria-controls'),
          'app-layout-sidebar',
        );
        assert.equal(openButton?.getAttribute('aria-expanded'), 'false');
        assert.equal(openButton?.tagName, 'BUTTON');

        await act(async () => {
          openButton?.dispatchEvent(
            new window.MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              button: 0,
            }),
          );
          await renderTick();
        });

        assert.equal(
          container
            .querySelector('.app-shell-sidebar')
            ?.getAttribute('data-is-open'),
          'true',
        );
        assert.equal(openButton?.getAttribute('aria-expanded'), 'true');

        const closeButton = container.querySelector(
          'button[aria-label="Close navigation"]',
        ) as HTMLButtonElement | null;

        assert.ok(closeButton, 'Expected sidebar close button');

        await act(async () => {
          closeButton?.dispatchEvent(
            new window.MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              button: 0,
            }),
          );
          await renderTick();
        });

        assert.equal(
          container
            .querySelector('.app-shell-sidebar')
            ?.getAttribute('data-is-open'),
          'false',
        );

        assert.equal(container.querySelector('a[href="/assessments"]'), null);
        assert.equal(container.querySelector('a[href="/reports"]'), null);

        await act(async () => {
          root.unmount();
        });
      }

      {
        const { container, root } = await renderApp('/dashboard');
        const openButton = container.querySelector(
          'button[aria-label="Open navigation menu"]',
        ) as HTMLButtonElement | null;

        await act(async () => {
          openButton?.dispatchEvent(
            new window.MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              button: 0,
            }),
          );
          await renderTick();
        });

        const companySwitcher = container.querySelector(
          '.sidebar-company-switcher',
        ) as HTMLButtonElement | null;

        assert.ok(companySwitcher, 'Expected the company switcher trigger');

        await act(async () => {
          companySwitcher?.dispatchEvent(
            new window.MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              button: 0,
            }),
          );
          await renderTick();
        });

        assert.equal(
          container
            .querySelector('.app-shell-sidebar')
            ?.getAttribute('data-is-open'),
          'true',
        );
        assert.equal(companySwitcher?.getAttribute('aria-expanded'), 'true');
        assert.ok(
          document.body.querySelector('[role="dialog"]'),
          'Expected the company switcher drawer to open',
        );
        assert.ok(
          document.body.textContent?.includes('No companies yet'),
          'Expected the empty company switcher state',
        );
        assert.ok(
          document.body.textContent?.includes('Create company'),
          'Expected the primary create company action',
        );

        await act(async () => {
          root.unmount();
        });
      }

      {
        const appShellStyles = readFileSync(
          resolve(process.cwd(), 'src/app/layouts/appShell/appShell.styled.ts'),
          'utf8',
        );
        const reportPreviewStyles = readFileSync(
          resolve(
            process.cwd(),
            'src/app/components/appsec/reportPreviewShell/reportPreviewShell.styled.ts',
          ),
          'utf8',
        );

        assert.ok(appShellStyles.includes('@media print'));
        assert.ok(appShellStyles.includes('.app-shell-sidebar'));
        assert.ok(appShellStyles.includes('.app-shell-topbar'));
        assert.ok(appShellStyles.includes('position: sticky;'));
        assert.ok(appShellStyles.includes('top: 0;'));
        assert.ok(reportPreviewStyles.includes('@media print'));
        assert.ok(reportPreviewStyles.includes('.report-preview-shell-header'));
      }
    })();

    function textContent(container: HTMLElement) {
      return container.textContent ?? '';
    }
  });
});

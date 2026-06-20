import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

import { AppLayout } from '~/app/layouts';
import { routes } from '~/routes';
import { AppThemeProvider, defaultTheme } from '~/theme';
import AppRouter from '../appRouter';

export const renderTick = () =>
  new Promise<void>(resolve => setTimeout(resolve, 0));

const originalFetch = globalThis.fetch;

export const setFetch = (value: typeof fetch) => {
  Object.defineProperty(globalThis, 'fetch', {
    value,
    configurable: true,
    writable: true,
  });
};

export const restoreFetch = () => {
  setFetch(originalFetch);
};

export const createJsonResponse = (
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

export const setupDom = (
  pathname: string,
  localStorageEntries?: Record<string, string>,
) => {
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="root"></div></body></html>',
    { url: `http://localhost${pathname}` },
  );

  const { window } = dom;

  setGlobal('window', window);
  setGlobal('document', window.document);
  setGlobal('navigator', window.navigator);
  setGlobal('HTMLElement', window.HTMLElement);

  // React's legacy input change polyfill can call attachEvent/detachEvent on
  // the active element, which JSDOM does not implement. Provide no-op shims so
  // focus-driven interactions do not throw in this test environment.
  const htmlElementPrototype = window.HTMLElement
    .prototype as typeof window.HTMLElement.prototype & {
    attachEvent?: () => void;
    detachEvent?: () => void;
  };

  htmlElementPrototype.attachEvent ??= () => undefined;
  htmlElementPrototype.detachEvent ??= () => undefined;

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

  return {
    container: window.document.getElementById('root'),
  };
};

export const renderApp = async (
  pathname: string,
  settle = true,
  localStorageEntries?: Record<string, string>,
) => {
  const { container } = setupDom(pathname, localStorageEntries);

  assert.ok(container, 'Expected root container to exist');

  const root = createRoot(container);

  await act(async () => {
    root.render(
      <AppThemeProvider>
        <ThemeProvider theme={defaultTheme}>
          <AppRouter />
        </ThemeProvider>
      </AppThemeProvider>,
    );
    if (settle) {
      await renderTick();
      await renderTick();
    }
  });

  return { container, root };
};

export const textContent = (container: HTMLElement) =>
  container.textContent ?? '';

export const renderRouteErrorFixture = async (pathname: string) => {
  const { container } = setupDom(pathname);

  assert.ok(container, 'Expected root container to exist');

  const root = createRoot(container);
  const originalConsoleError = console.error;
  console.error = () => undefined;

  const ThrowingRoute = () => {
    throw new Error('Simulated route failure');
  };

  try {
    await act(async () => {
      root.render(
        <ThemeProvider theme={defaultTheme}>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route
                  path="/dashboard"
                  element={<h1>Security Dashboard</h1>}
                />
                <Route path="/broken" element={<ThrowingRoute />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ThemeProvider>,
      );
      await renderTick();
      await renderTick();
    });
  } finally {
    console.error = originalConsoleError;
  }

  return { container, root };
};

export const renderRouteLoadingFixture = async (pathname: string) => {
  const { container } = setupDom(pathname);

  assert.ok(container, 'Expected root container to exist');

  const root = createRoot(container);
  const DelayedRoute = React.lazy(
    () =>
      new Promise<{ default: React.ComponentType }>(resolve => {
        window.setTimeout(() => {
          resolve({
            default: () => <h1 className="test-page-title">Loaded page</h1>,
          });
        }, 50);
      }),
  );

  await act(async () => {
    root.render(
      <ThemeProvider theme={defaultTheme}>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DelayedRoute />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>,
    );
    await renderTick();
  });

  return { container, root };
};

export const assertRouteRenders = async (
  pathname: string,
  expectedText: string,
) => {
  const { container, root } = await renderApp(pathname);

  assert.ok(
    textContent(container).includes(expectedText),
    `Expected route ${pathname} to contain "${expectedText}"`,
  );

  await act(async () => {
    root.unmount();
  });
};
export const setupAssessmentWorkspaceFetchFixture = () => {
  setFetch(async input => {
    const path = String(input);

    if (path === '/api/companies') {
      return createJsonResponse({
        data: [
          {
            id: 'cmp_1',
            name: 'Northwind Labs',
            website: 'https://northwind.example',
            contactEmail: 'security@northwind.example',
            assessmentCount: 2,
            createdAt: '2026-06-01T00:00:00.000Z',
            updatedAt: '2026-06-10T00:00:00.000Z',
          },
        ],
      });
    }

    if (path === '/api/companies/cmp_1/assessments') {
      return createJsonResponse({
        data: [
          {
            id: 'asm_1',
            name: 'Customer Services Portal',
            type: 'Web App',
            status: 'in-progress',
            findingsCount: 14,
            updatedAt: '2026-06-15T09:00:00.000Z',
            description: 'Assessment of the customer portal',
            scope: 'Web application',
          },
          {
            id: 'asm_5',
            name: 'Data Export Service',
            type: 'API',
            status: 'archived',
            findingsCount: 3,
            updatedAt: '2026-06-12T09:00:00.000Z',
            description: 'Archived export service review',
            scope: 'Backend API',
          },
        ],
      });
    }

    if (path === '/api/companies/cmp_1/assessments/asm_1/overview') {
      return createJsonResponse({
        data: {
          company: {
            id: 'cmp_1',
            name: 'Northwind Labs',
          },
          assessment: {
            id: 'asm_1',
            companyId: 'cmp_1',
            title: 'Customer Services Portal',
            description: 'Assessment of the customer portal',
            scope: 'Web application',
            status: 'in-progress',
            startedAt: '2026-06-01',
            completedAt: '2026-06-10',
            applicationName: 'Customer Services Portal',
            environment: 'Production',
            assessmentType: 'Web App',
            overallRisk: 'high',
            createdAt: '2026-06-01T09:00:00.000Z',
            updatedAt: '2026-06-11T09:00:00.000Z',
            recordVersion: 3,
            findingsCount: 14,
            evidenceCount: 6,
            reportVersionCount: 2,
            testerName: 'Alex Mercer',
            availableActions: ['complete', 'archive'],
          },
        },
      });
    }

    if (path === '/api/companies/cmp_1/assessments/asm_5/overview') {
      return createJsonResponse({
        data: {
          company: {
            id: 'cmp_1',
            name: 'Northwind Labs',
          },
          assessment: {
            id: 'asm_5',
            companyId: 'cmp_1',
            title: 'Data Export Service',
            status: 'archived',
            applicationName: 'Data Export Service',
            environment: 'Production',
            assessmentType: 'API',
            overallRisk: 'low',
            createdAt: '2026-05-16T09:00:00.000Z',
            updatedAt: '2026-05-24T09:00:00.000Z',
            recordVersion: 1,
            findingsCount: 3,
            evidenceCount: 0,
            reportVersionCount: 0,
            testerName: 'Jordan Lee',
            availableActions: ['reopen'],
          },
        },
      });
    }

    if (path === '/api/companies/cmp_1/assessments/asm_missing/overview') {
      return createJsonResponse(
        {
          error: {
            code: 'ASSESSMENT_NOT_FOUND',
            message: 'Assessment not found',
            details: [],
          },
        },
        { status: 404 },
      );
    }

    if (path === '/api/companies/cmp_1/assessments/asm_1/commands/complete') {
      return createJsonResponse(
        {
          error: {
            code: 'RESOURCE_MODIFIED',
            message: 'The assessment was modified by another session.',
            details: [],
          },
        },
        { status: 409 },
      );
    }

    throw new Error(`Unexpected request: ${path}`);
  });
};

export { assert, act, routes };

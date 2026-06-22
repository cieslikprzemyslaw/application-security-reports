import assert from 'node:assert/strict';

import React from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

import { ApplicationErrorBoundary } from '~/app/components/routeStateViews';
import { AppLayout } from '~/app/layouts';
import { routes } from '~/routes';
import {
  act,
  createTestDom,
  createTestingLibraryRoot,
  waitFor,
} from '~/test/vitestLegacyBridge';
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

export const setupDom = (
  pathname: string,
  localStorageEntries?: Record<string, string>,
) => {
  const { window } = createTestDom(
    '<!doctype html><html><body><div id="root"></div></body></html>',
    { url: 'http://localhost' + pathname },
  );

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

  const root = createTestingLibraryRoot(container);

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

  const root = createTestingLibraryRoot(container);
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

export const renderApplicationErrorFixture = async (
  pathname: string,
  onReload: () => void,
) => {
  const { container } = setupDom(pathname);

  assert.ok(container, 'Expected root container to exist');

  const root = createTestingLibraryRoot(container);
  const originalConsoleError = console.error;
  console.error = () => undefined;

  const preventExpectedApplicationError = (event: ErrorEvent) => {
    const error = event.error;

    if (
      error instanceof Error &&
      error.message === 'Simulated application failure'
    ) {
      event.preventDefault();
    }
  };

  window.addEventListener('error', preventExpectedApplicationError);

  const ThrowingRoute = () => {
    throw new Error('Simulated application failure');
  };

  const ApplicationBoundaryFixture = () => {
    const location = useLocation();

    return (
      <ApplicationErrorBoundary key={location.pathname} onReload={onReload}>
        <Routes>
          <Route path="/dashboard" element={<h1>Security Dashboard</h1>} />
          <Route path="/broken" element={<ThrowingRoute />} />
        </Routes>
      </ApplicationErrorBoundary>
    );
  };

  try {
    await act(async () => {
      root.render(
        <ThemeProvider theme={defaultTheme}>
          <BrowserRouter>
            <ApplicationBoundaryFixture />
          </BrowserRouter>
        </ThemeProvider>,
      );
      await renderTick();
      await renderTick();
    });
  } finally {
    window.removeEventListener('error', preventExpectedApplicationError);
    console.error = originalConsoleError;
  }

  return { container, root };
};

export const renderRouteLoadingFixture = async (pathname: string) => {
  const { container } = setupDom(pathname);

  assert.ok(container, 'Expected root container to exist');

  const root = createTestingLibraryRoot(container);
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

export { assert, act, routes, waitFor };
export { setupAssessmentWorkspaceFetchFixture } from './supportAppRouter';

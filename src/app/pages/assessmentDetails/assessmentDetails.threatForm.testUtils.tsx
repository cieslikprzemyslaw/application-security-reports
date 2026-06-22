import assert from 'node:assert/strict';

import {
  createTestDom,
  createTestingLibraryRoot,
  act,
} from '~/test/vitestLegacyBridge';

import { ThemeProvider } from 'styled-components';

import AppRouter from '~/app/appRouter';
import { defaultTheme } from '~/theme';

export const renderTick = () =>
  new Promise<void>(resolve => setTimeout(resolve, 0));

export const setFetch = (value: typeof fetch) => {
  Object.defineProperty(globalThis, 'fetch', {
    value,
    configurable: true,
    writable: true,
  });
};

const originalFetch = globalThis.fetch;

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

export const setGlobal = <K extends PropertyKey>(key: K, value: unknown) => {
  Object.defineProperty(globalThis, key, {
    value,
    configurable: true,
    writable: true,
  });
};

export const setupDom = (pathname: string) => {
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

  Object.defineProperty(window.HTMLElement.prototype, 'attachEvent', {
    value: () => undefined,
    configurable: true,
  });

  Object.defineProperty(window.HTMLElement.prototype, 'detachEvent', {
    value: () => undefined,
    configurable: true,
  });

  Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
    value: () => undefined,
    configurable: true,
  });

  return {
    container: window.document.getElementById('root'),
    window,
  };
};

export const renderApp = async (pathname: string) => {
  const { container, window } = setupDom(pathname);

  assert.ok(container, 'Expected root container to exist');
  const root = createTestingLibraryRoot(container);

  await act(async () => {
    root.render(
      <ThemeProvider theme={defaultTheme}>
        <AppRouter />
      </ThemeProvider>,
    );
    await renderTick();
    await renderTick();
  });

  return { container, root, window };
};

export const textContent = (container: HTMLElement) =>
  container.textContent ?? '';

import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';

import AppRouter from '~/app/appRouter';
import { AppThemeProvider, defaultTheme } from '~/theme';

export type TestWindow = Window &
  typeof globalThis & {
    confirm: (message?: string) => boolean;
  };

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

export const createJsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json', ...init.headers },
    ...init,
  });

export const createErrorResponse = (
  status: number,
  message: string,
  code = 'REQUEST_FAILED',
) =>
  createJsonResponse(
    {
      error: {
        code,
        message,
        details: [],
      },
    },
    { status },
  );

const setGlobal = <K extends PropertyKey>(key: K, value: unknown) => {
  Object.defineProperty(globalThis, key, {
    value,
    configurable: true,
    writable: true,
  });
};

export const getRequestDetails = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => {
  const rawTarget =
    input instanceof URL
      ? input.toString()
      : input instanceof Request
        ? input.url
        : String(input);

  return {
    method: init?.method ?? (input instanceof Request ? input.method : 'GET'),
    path: new URL(rawTarget, 'http://localhost').pathname,
  };
};

const setupDom = (pathname: string) => {
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="root"></div></body></html>',
    { url: `http://localhost${pathname}` },
  );
  const { window } = dom;

  window.URL.createObjectURL = () => 'blob:mock-company-logo';
  window.URL.revokeObjectURL = () => undefined;

  setGlobal('window', window);
  setGlobal('document', window.document);
  setGlobal('navigator', window.navigator);
  setGlobal('HTMLElement', window.HTMLElement);
  setGlobal('Node', window.Node);
  setGlobal('URL', window.URL);
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

  const container = window.document.getElementById('root');
  assert.ok(container, 'Expected the root test container');

  return {
    container,
    window: window as unknown as TestWindow,
  };
};

export const renderApp = async (
  pathname: string,
): Promise<{
  container: HTMLElement;
  root: Root;
  window: TestWindow;
}> => {
  const { container, window } = setupDom(pathname);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      <AppThemeProvider>
        <ThemeProvider theme={defaultTheme}>
          <AppRouter />
        </ThemeProvider>
      </AppThemeProvider>,
    );

    await renderTick();
    await renderTick();
  });

  return { container, root, window };
};

export const cleanupRoot = async (root: Root) => {
  await act(async () => {
    root.unmount();
  });
};

export const findButtonByText = (container: ParentNode, text: string) =>
  Array.from(container.querySelectorAll<HTMLButtonElement>('button')).find(
    button => button.textContent?.includes(text),
  );

export const fillCompanyName = async (window: TestWindow, name: string) => {
  const input = window.document.querySelector(
    '#company-name',
  ) as HTMLInputElement | null;

  assert.ok(input, 'Expected the company name input');

  await act(async () => {
    input.value = name;
    input.dispatchEvent(
      new window.Event('input', {
        bubbles: true,
        cancelable: true,
      }),
    );
    await renderTick();
  });
};

export const selectLogoFile = async (
  window: TestWindow,
  file: File,
  selector = '#company-logo',
) => {
  const input = window.document.querySelector(
    selector,
  ) as HTMLInputElement | null;

  assert.ok(input, `Expected the file input ${selector}`);

  await act(async () => {
    Object.defineProperty(input, 'files', {
      value: { 0: file, length: 1, item: () => file },
      configurable: true,
    });
    input.dispatchEvent(
      new window.Event('change', {
        bubbles: true,
        cancelable: true,
      }),
    );
    await renderTick();
  });
};

export const clickButton = async (
  window: TestWindow,
  button: HTMLButtonElement,
) => {
  await act(async () => {
    button.dispatchEvent(
      new window.MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        button: 0,
      }),
    );
    await renderTick();
    await renderTick();
    await renderTick();
  });
};

export const createLogoFile = (window: TestWindow, name = 'logo.png') =>
  new window.File(['fake-png'], name, { type: 'image/png' });

import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

import type { GlobalThreatRow } from '~/app/components/appsec/globalThreatTable';
import Dashboard from '~/app/pages/dashboard';
import Companies from '~/app/pages/companies';
import Assessments from '~/app/pages/assessments';
import Threats from '~/app/pages/threats';
import { defaultTheme } from '~/theme';

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

export const setupDom = (localStorageEntries?: Record<string, string>) => {
  const dom = new JSDOM(
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

  const container = window.document.getElementById('root');

  assert.ok(container, 'Expected root container to exist');

  return { container };
};

export const renderComponent = async (
  element: React.ReactNode,
  localStorageEntries?: Record<string, string>,
  initialEntry = '/',
) => {
  const { container } = setupDom(localStorageEntries);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      <ThemeProvider theme={defaultTheme}>
        <MemoryRouter initialEntries={[initialEntry]}>{element}</MemoryRouter>
      </ThemeProvider>,
    );
    await renderTick();
    await renderTick();
  });

  return { container, root };
};

export const textContent = (container: HTMLElement) =>
  container.textContent ?? '';

const sampleThreat: GlobalThreatRow = {
  id: 'thr_1',
  title: 'Stored XSS in comment body',
  applicationName: 'Northwind Portal',
  companyName: 'Northwind Labs',
  strideCategory: 'tampering',
  severity: 'high',
  status: 'open',
  updatedAt: '2026-06-14',
};
export {
  assert,
  act,
  Dashboard,
  Companies,
  Assessments,
  Threats,
  sampleThreat,
};

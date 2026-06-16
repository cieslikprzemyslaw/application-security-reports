import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { AppThemeProvider, themePreferenceStorageKey } from '~/theme';
import type { Settings } from '~/domain';

import SettingsRoute from './index';

const renderTick = () => new Promise<void>(resolve => setTimeout(resolve, 0));

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

const createJsonResponse = (body: unknown, init: ResponseInit = {}): Response =>
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
  const root = createRoot(container);

  await act(async () => {
    root.render(
      <AppThemeProvider>
        <BrowserRouter>
          <SettingsRoute />
        </BrowserRouter>
      </AppThemeProvider>,
    );

    await renderTick();
    await renderTick();
  });

  return { container, root, window };
};

const findByLabel = (window: TestWindow, label: string) =>
  window.document.querySelector(
    `input#${label}, select#${label}, textarea#${label}`,
  ) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;

await (async () => {
  const baselineSettings: Settings = {
    id: 'settings_1',
    organisationName: 'Northstar Digital',
    consultantName: 'Alex Mercer',
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

  setFetch(async input => {
    requestCount += 1;

    const request =
      input instanceof Request ? input : new Request(String(input));

    if (request.method === 'GET') {
      return createJsonResponse({ data: baselineSettings });
    }

    if (request.method === 'PATCH') {
      patchBody = (await request.clone().json()) as Record<string, unknown>;

      return createJsonResponse({
        data: {
          ...baselineSettings,
          consultantName: 'Jordan Lee',
          theme: 'dark',
        },
      });
    }

    throw new Error(`Unexpected request method: ${request.method}`);
  });

  try {
    const { container, root, window } = await renderComponent();

    assert.equal(requestCount, 1);

    const consultantNameInput = findByLabel(window, 'consultantName');
    const themeSelect = findByLabel(window, 'theme');

    assert.ok(consultantNameInput, 'Expected the consultant name field');
    assert.ok(themeSelect, 'Expected the theme selector');

    await act(async () => {
      consultantNameInput!.value = 'Jordan Lee';
      consultantNameInput!.dispatchEvent(
        new window.Event('input', {
          bubbles: true,
          cancelable: true,
        }),
      );

      themeSelect!.value = 'dark';
      themeSelect!.dispatchEvent(
        new window.Event('change', {
          bubbles: true,
          cancelable: true,
        }),
      );

      await renderTick();
    });

    const saveButton = Array.from(container.querySelectorAll('button')).find(
      button => button.textContent?.includes('Save settings'),
    ) as HTMLButtonElement | undefined;

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

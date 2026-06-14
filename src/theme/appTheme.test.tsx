import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useTheme } from 'styled-components';

import {
  AppThemeProvider,
  themePreferenceStorageKey,
  useThemePreference,
} from './index';

const renderTick = () => new Promise<void>(resolve => setTimeout(resolve, 0));

const setGlobal = <K extends PropertyKey>(key: K, value: unknown) => {
  Object.defineProperty(globalThis, key, {
    value,
    configurable: true,
    writable: true,
  });
};

const setupDom = () => {
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

  return {
    container: window.document.getElementById('root'),
    window,
  };
};

const createMatchMediaStub = (matches: boolean) => {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  const mediaQueryList = {
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    get matches() {
      return matches;
    },
    addEventListener: (
      _type: 'change',
      listener: (event: MediaQueryListEvent) => void,
    ) => {
      listeners.add(listener);
    },
    removeEventListener: (
      _type: 'change',
      listener: (event: MediaQueryListEvent) => void,
    ) => {
      listeners.delete(listener);
    },
    addListener: (listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeListener: (listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
    dispatch(nextMatches: boolean) {
      matches = nextMatches;

      const event = {
        matches,
        media: '(prefers-color-scheme: dark)',
      } as MediaQueryListEvent;

      listeners.forEach(listener => listener(event));
    },
  } as const satisfies MediaQueryList & {
    dispatch: (nextMatches: boolean) => void;
  };

  return mediaQueryList;
};

const PreferenceProbe = () => {
  const { themePreference, resolvedTheme, setThemePreference } =
    useThemePreference();
  const theme = useTheme();

  return (
    <div>
      <output data-testid="theme-preference">{themePreference}</output>
      <output data-testid="resolved-theme">{resolvedTheme}</output>
      <output data-testid="surface-page">{theme.colors.surface.page}</output>

      <button type="button" onClick={() => setThemePreference('light')}>
        Light
      </button>

      <button type="button" onClick={() => setThemePreference('dark')}>
        Dark
      </button>

      <button type="button" onClick={() => setThemePreference('system')}>
        System
      </button>
    </div>
  );
};

const renderApp = async (matches: boolean) => {
  const { container, window } = setupDom();
  const mediaQueryList = createMatchMediaStub(matches);

  Object.defineProperty(window, 'matchMedia', {
    value: () => mediaQueryList,
    configurable: true,
    writable: true,
  });

  assert.ok(container, 'Expected root container to exist');

  const root = createRoot(container);

  await act(async () => {
    root.render(
      <AppThemeProvider>
        <PreferenceProbe />
      </AppThemeProvider>,
    );
    await renderTick();
  });

  return { container, root, mediaQueryList, window };
};

const clickButton = async (
  container: HTMLElement,
  domWindow: Window,
  label: string,
) => {
  const button = Array.from(container.querySelectorAll('button')).find(
    element => element.textContent === label,
  ) as HTMLButtonElement | undefined;

  assert.ok(button, `Expected a "${label}" button`);

  await act(async () => {
    button?.dispatchEvent(
      new domWindow.MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        button: 0,
      }),
    );
    await renderTick();
  });
};

await (async () => {
  const { container, root, mediaQueryList, window } = await renderApp(false);

  assert.equal(
    container.querySelector('[data-testid="theme-preference"]')?.textContent,
    'system',
  );
  assert.equal(
    container.querySelector('[data-testid="resolved-theme"]')?.textContent,
    'light',
  );
  assert.equal(
    container.querySelector('[data-testid="surface-page"]')?.textContent,
    '#F4F6FA',
  );
  assert.equal(window.document.documentElement.dataset.theme, 'light');
  assert.equal(
    window.localStorage.getItem(themePreferenceStorageKey),
    'system',
  );

  await clickButton(container, window, 'Dark');

  assert.equal(
    container.querySelector('[data-testid="theme-preference"]')?.textContent,
    'dark',
  );
  assert.equal(
    container.querySelector('[data-testid="resolved-theme"]')?.textContent,
    'dark',
  );
  assert.equal(
    container.querySelector('[data-testid="surface-page"]')?.textContent,
    '#0E1421',
  );
  assert.equal(window.document.documentElement.dataset.theme, 'dark');
  assert.equal(window.localStorage.getItem(themePreferenceStorageKey), 'dark');

  await clickButton(container, window, 'Light');

  assert.equal(
    container.querySelector('[data-testid="theme-preference"]')?.textContent,
    'light',
  );
  assert.equal(
    container.querySelector('[data-testid="resolved-theme"]')?.textContent,
    'light',
  );
  assert.equal(
    container.querySelector('[data-testid="surface-page"]')?.textContent,
    '#F4F6FA',
  );
  assert.equal(window.document.documentElement.dataset.theme, 'light');
  assert.equal(window.localStorage.getItem(themePreferenceStorageKey), 'light');

  await clickButton(container, window, 'System');

  assert.equal(
    container.querySelector('[data-testid="theme-preference"]')?.textContent,
    'system',
  );
  assert.equal(
    container.querySelector('[data-testid="resolved-theme"]')?.textContent,
    'light',
  );
  assert.equal(
    window.localStorage.getItem(themePreferenceStorageKey),
    'system',
  );

  await act(async () => {
    mediaQueryList.dispatch(true);
    await renderTick();
  });

  assert.equal(
    container.querySelector('[data-testid="resolved-theme"]')?.textContent,
    'dark',
  );
  assert.equal(
    container.querySelector('[data-testid="surface-page"]')?.textContent,
    '#0E1421',
  );
  assert.equal(window.document.documentElement.dataset.theme, 'dark');

  await act(async () => {
    root.unmount();
  });
})();

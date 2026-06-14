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

const renderTick = () =>
  new Promise(resolve => {
    setTimeout(resolve, 0);
  });

const setGlobal = (key: keyof typeof globalThis | string, value: unknown) => {
  Object.defineProperty(globalThis, key, {
    value,
    configurable: true,
    writable: true,
  });
};

const setupDom = () => {
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="root"></div></body></html>',
    {
      url: 'http://localhost/',
    },
  );

  const { window } = dom;

  setGlobal('window', window);
  setGlobal('document', window.document);
  setGlobal('navigator', window.navigator);
  setGlobal('HTMLElement', window.HTMLElement);
  setGlobal('Node', window.Node);
  setGlobal('MouseEvent', window.MouseEvent);

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

type MatchMediaStub = MediaQueryList & {
  dispatch: (nextMatches: boolean) => void;
};

const createMatchMediaStub = (initialMatches: boolean): MatchMediaStub => {
  let matches = initialMatches;

  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  const addEventListener: MediaQueryList['addEventListener'] = (
    type: string,
    listener: EventListenerOrEventListenerObject | null,
  ) => {
    if (type !== 'change' || listener === null) {
      return;
    }

    if (typeof listener === 'function') {
      listeners.add(listener as (event: MediaQueryListEvent) => void);
    } else {
      listeners.add(event => {
        listener.handleEvent(event);
      });
    }
  };

  const removeEventListener: MediaQueryList['removeEventListener'] = (
    type: string,
    listener: EventListenerOrEventListenerObject | null,
  ) => {
    if (
      type !== 'change' ||
      listener === null ||
      typeof listener !== 'function'
    ) {
      return;
    }

    listeners.delete(listener as (event: MediaQueryListEvent) => void);
  };

  const mediaQueryList: MatchMediaStub = {
    media: '(prefers-color-scheme: dark)',
    onchange: null,

    get matches() {
      return matches;
    },

    addEventListener,
    removeEventListener,

    addListener: listener => {
      if (listener) {
        listeners.add(listener as (event: MediaQueryListEvent) => void);
      }
    },

    removeListener: listener => {
      if (listener) {
        listeners.delete(listener as (event: MediaQueryListEvent) => void);
      }
    },

    dispatchEvent: () => true,

    dispatch(nextMatches: boolean) {
      matches = nextMatches;

      const event = {
        matches,
        media: '(prefers-color-scheme: dark)',
      } as MediaQueryListEvent;

      listeners.forEach(listener => {
        listener(event);
      });
    },
  };

  return mediaQueryList;
};

const PreferenceProbe = () => {
  const { themePreference, resolvedTheme, setThemePreference } =
    useThemePreference();

  const theme = useTheme();

  return (
    <div>
      {' '}
      <span data-testid="theme-preference">{themePreference} </span>
      <span data-testid="resolved-theme">{resolvedTheme}</span>
      <span data-testid="surface-page">{theme.colors.surface.page}</span>
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
        {' '}
        <PreferenceProbe />{' '}
      </AppThemeProvider>,
    );

    await renderTick();
  });

  return {
    container,
    root,
    mediaQueryList,
    window,
  };
};

const clickButton = async (container: HTMLElement, label: string) => {
  const button = Array.from(container.querySelectorAll('button')).find(
    element => element.textContent === label,
  ) as HTMLButtonElement | undefined;

  assert.ok(button, `Expected a "${label}" button`);

  await act(async () => {
    button.dispatchEvent(
      new MouseEvent('click', {
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

  await clickButton(container, 'Dark');

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

  await clickButton(container, 'Light');

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

  await clickButton(container, 'System');

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

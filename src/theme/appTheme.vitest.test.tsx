import { describe, it } from 'vitest';

import assert from 'node:assert/strict';

import {
  createTestDom,
  createTestingLibraryRoot,
  act,
} from '~/test/vitestLegacyBridge';

import { useTheme } from 'styled-components';

import { darkColors, lightColors } from './colors';

import {
  AppThemeProvider,
  themePreferenceStorageKey,
  useThemePreference,
} from './index';

describe('appTheme', () => {
  it('passes the migrated checks', async () => {
    const renderTick = () =>
      new Promise(resolve => {
        setTimeout(resolve, 0);
      });

    const setGlobal = (
      key: keyof typeof globalThis | string,
      value: unknown,
    ) => {
      Object.defineProperty(globalThis, key, {
        value,
        configurable: true,
        writable: true,
      });
    };

    const setupDom = () => {
      const dom = createTestDom(
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
          <span data-testid="theme-preference">{themePreference}</span>
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

      const root = createTestingLibraryRoot(container);

      await act(async () => {
        root.render(
          <AppThemeProvider>
            <PreferenceProbe />
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
      const { container, root, mediaQueryList, window } =
        await renderApp(false);

      assert.equal(
        container.querySelector('[data-testid="theme-preference"]')
          ?.textContent,
        'system',
      );

      assert.equal(
        container.querySelector('[data-testid="resolved-theme"]')?.textContent,
        'light',
      );

      assert.equal(
        container.querySelector('[data-testid="surface-page"]')?.textContent,
        '#F4F8FF',
      );

      assert.equal(window.document.documentElement.dataset.theme, 'light');

      assert.equal(
        window.localStorage.getItem(themePreferenceStorageKey),
        'system',
      );

      await clickButton(container, 'Dark');

      assert.equal(
        container.querySelector('[data-testid="theme-preference"]')
          ?.textContent,
        'dark',
      );

      assert.equal(
        container.querySelector('[data-testid="resolved-theme"]')?.textContent,
        'dark',
      );

      assert.equal(
        container.querySelector('[data-testid="surface-page"]')?.textContent,
        '#111827',
      );

      assert.equal(window.document.documentElement.dataset.theme, 'dark');

      assert.equal(
        window.localStorage.getItem(themePreferenceStorageKey),
        'dark',
      );

      await clickButton(container, 'Light');

      assert.equal(
        container.querySelector('[data-testid="theme-preference"]')
          ?.textContent,
        'light',
      );

      assert.equal(
        container.querySelector('[data-testid="resolved-theme"]')?.textContent,
        'light',
      );

      assert.equal(
        container.querySelector('[data-testid="surface-page"]')?.textContent,
        '#F4F8FF',
      );

      assert.equal(window.document.documentElement.dataset.theme, 'light');

      assert.equal(
        window.localStorage.getItem(themePreferenceStorageKey),
        'light',
      );

      await clickButton(container, 'System');

      assert.equal(
        container.querySelector('[data-testid="theme-preference"]')
          ?.textContent,
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
        '#111827',
      );

      assert.equal(window.document.documentElement.dataset.theme, 'dark');

      await act(async () => {
        root.unmount();
      });
    })();
  });
});

const hexToRelativeLuminance = (hexColor: string) => {
  const channels = hexColor
    .replace('#', '')
    .match(/.{2}/g)
    ?.map(channel => Number.parseInt(channel, 16) / 255);

  assert.ok(channels && channels.length === 3, `Invalid colour: ${hexColor}`);

  const [red, green, blue] = channels.map(channel =>
    channel <= 0.04045
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4),
  );

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

const getContrastRatio = (foreground: string, background: string) => {
  const foregroundLuminance = hexToRelativeLuminance(foreground);
  const backgroundLuminance = hexToRelativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
};

const assertContrast = (
  label: string,
  foreground: string,
  background: string,
  minimumRatio: number,
) => {
  const ratio = getContrastRatio(foreground, background);

  assert.ok(
    ratio >= minimumRatio,
    `${label} contrast ${ratio.toFixed(2)} is below ${minimumRatio}:1`,
  );
};

describe('theme accessibility contrast', () => {
  it('keeps text, controls, statuses and focus indicators at AA contrast', () => {
    for (const [themeName, colors] of [
      ['light', lightColors],
      ['dark', darkColors],
    ] as const) {
      assertContrast(
        `${themeName} primary text`,
        colors.text.primary,
        colors.surface.page,
        4.5,
      );
      assertContrast(
        `${themeName} secondary text`,
        colors.text.secondary,
        colors.surface.card,
        4.5,
      );
      assertContrast(
        `${themeName} muted text`,
        colors.text.muted,
        colors.surface.card,
        4.5,
      );
      assertContrast(
        `${themeName} link`,
        colors.text.link,
        colors.surface.card,
        4.5,
      );
      assertContrast(
        `${themeName} inverse text`,
        colors.text.inverse,
        colors.surface.inverse,
        4.5,
      );
      assertContrast(
        `${themeName} inverse secondary text`,
        colors.text.inverseSecondary,
        colors.surface.inverse,
        4.5,
      );
      assertContrast(
        `${themeName} inverse muted text`,
        colors.text.inverseMuted,
        colors.surface.inverse,
        4.5,
      );
      assertContrast(
        `${themeName} sidebar accent`,
        colors.brand.accent,
        colors.surface.inverse,
        3,
      );
      assertContrast(
        `${themeName} primary button`,
        colors.button.primary.default.text,
        colors.button.primary.default.background,
        4.5,
      );
      assertContrast(
        `${themeName} focus indicator`,
        colors.border.focus,
        colors.surface.card,
        3,
      );
      assertContrast(
        `${themeName} control border`,
        colors.border.default,
        colors.surface.card,
        3,
      );

      for (const [severityName, severity] of Object.entries(colors.severity)) {
        assertContrast(
          `${themeName} ${severityName} severity`,
          severity.text,
          severity.background,
          4.5,
        );
      }

      for (const [statusName, status] of Object.entries(colors.status)) {
        assertContrast(
          `${themeName} ${statusName} status`,
          status.text,
          status.background,
          4.5,
        );
      }
    }
  });
});

import type { ReactElement } from 'react';

import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react';

export { act, fireEvent, waitFor };

interface TestDomOptions {
  url?: string;
}

const defaultMarkup =
  '<!doctype html><html><body><div id="root"></div></body></html>';

/**
 * Resets Vitest's shared jsdom document to the markup expected by a migrated
 * legacy test. This intentionally uses the jsdom environment configured by
 * Vitest instead of creating and installing a second JSDOM instance.
 */
export const createTestDom = (
  markup = defaultMarkup,
  options: TestDomOptions = {},
) => {
  cleanup();

  window.localStorage.clear();
  window.sessionStorage.clear();

  document.open();
  document.write(markup);
  document.close();

  const targetUrl = new URL(
    options.url ?? 'http://localhost/',
    window.location.href,
  );

  window.history.replaceState(
    {},
    '',
    `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}` || '/',
  );

  return {
    window: window as Window & typeof globalThis,
  };
};

export interface TestingLibraryRoot {
  render(ui: ReactElement): void;
  unmount(): void;
}

/**
 * Small migration adapter for tests that previously called ReactDOM.createRoot.
 * Rendering and rerendering are delegated to Testing Library.
 */
export const createTestingLibraryRoot = (
  container: HTMLElement,
): TestingLibraryRoot => {
  let result:
    | {
        rerender(ui: ReactElement): void;
        unmount(): void;
      }
    | undefined;

  return {
    render(ui) {
      if (result) {
        result.rerender(ui);
        return;
      }

      result = render(ui, { container });
    },

    unmount() {
      result?.unmount();
      result = undefined;
    },
  };
};

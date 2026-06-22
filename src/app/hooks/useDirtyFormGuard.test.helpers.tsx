import assert from 'node:assert/strict';

import {
  createTestDom,
  createTestingLibraryRoot,
  act,
} from '~/test/vitestLegacyBridge';

import { useState } from 'react';
import { createMemoryRouter, Link, RouterProvider } from 'react-router-dom';

import DirtyFormGuard from '~/app/components/common/dirtyFormGuard';
import { AppThemeProvider } from '~/theme';

import { useDirtyFormGuard } from './useDirtyFormGuard';

export { assert, act };

export const renderTick = () =>
  new Promise<void>(resolve => setTimeout(resolve, 0));

export type TestWindow = Window & typeof globalThis;

const setGlobal = <K extends PropertyKey>(key: K, value: unknown) => {
  Object.defineProperty(globalThis, key, {
    value,
    configurable: true,
    writable: true,
  });
};

export const setupDom = () => {
  const dom = createTestDom(
    '<!doctype html><html><body><div id="root"></div></body></html>',
    { url: 'http://localhost/form' },
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

  assert.ok(container, 'Expected root container');

  return { container, window: window as unknown as TestWindow };
};

const TestForm = () => {
  const [isDirty, setIsDirty] = useState(false);
  const guard = useDirtyFormGuard(isDirty);

  return (
    <div>
      <h1>Form page</h1>
      <button id="make-dirty" type="button" onClick={() => setIsDirty(true)}>
        Make dirty
      </button>
      <button id="make-clean" type="button" onClick={() => setIsDirty(false)}>
        Reset clean
      </button>
      <Link to="/other">Navigate away</Link>
      <DirtyFormGuard
        isBlocked={guard.isBlocked}
        onProceed={guard.proceed}
        onCancel={guard.cancel}
      />
    </div>
  );
};

const createTestRouter = () =>
  createMemoryRouter(
    [
      { path: '/form', element: <TestForm /> },
      { path: '/other', element: <h1>Other page</h1> },
    ],
    { initialEntries: ['/form'] },
  );

export const renderTest = async () => {
  const { container, window } = setupDom();
  const root = createTestingLibraryRoot(container);
  const router = createTestRouter();

  await act(async () => {
    root.render(
      <AppThemeProvider>
        <RouterProvider router={router} />
      </AppThemeProvider>,
    );
    await renderTick();
    await renderTick();
  });

  return { container, root, router, window };
};

export const clickById = async (window: TestWindow, id: string) => {
  const el = window.document.getElementById(id) as HTMLButtonElement | null;

  assert.ok(el, `Expected element #${id}`);

  await act(async () => {
    el.dispatchEvent(
      new window.MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        button: 0,
      }),
    );
    await renderTick();
    await renderTick();
  });
};

export const findDialogButton = (
  window: TestWindow,
  text: string,
): HTMLButtonElement | undefined =>
  Array.from(
    window.document.querySelectorAll<HTMLButtonElement>(
      '[role="dialog"] button',
    ),
  ).find(btn => btn.textContent?.includes(text));

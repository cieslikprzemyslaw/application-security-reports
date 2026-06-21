import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';
import React, { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createMemoryRouter, Link, RouterProvider } from 'react-router-dom';

import DirtyFormGuard from '~/app/components/common/dirtyFormGuard';
import { AppThemeProvider } from '~/theme';

import { useDirtyFormGuard } from './useDirtyFormGuard';

const renderTick = () => new Promise<void>(resolve => setTimeout(resolve, 0));

type TestWindow = Window & typeof globalThis;

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

const renderTest = async () => {
  const { container, window } = setupDom();
  const root = createRoot(container);
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

const clickById = async (window: TestWindow, id: string) => {
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

const findDialogButton = (
  window: TestWindow,
  text: string,
): HTMLButtonElement | undefined =>
  Array.from(
    window.document.querySelectorAll<HTMLButtonElement>(
      '[role="dialog"] button',
    ),
  ).find(btn => btn.textContent?.includes(text));

await (async () => {
  // Clean form: no dialog, navigation completes immediately
  const { container, root, router, window } = await renderTest();

  assert.equal(router.state.location.pathname, '/form');

  await act(async () => {
    await router.navigate('/other');
    await renderTick();
  });

  assert.equal(router.state.location.pathname, '/other');
  assert.ok(
    !window.document.querySelector('[role="dialog"]'),
    'Expected no dialog for a clean form',
  );
  assert.ok(container.textContent?.includes('Other page'));

  await act(async () => {
    root.unmount();
  });
})();

await (async () => {
  // Dirty form: navigation is blocked, dialog appears
  const { root, router, window } = await renderTest();

  await clickById(window, 'make-dirty');

  await act(async () => {
    await router.navigate('/other');
    await renderTick();
  });

  assert.equal(router.state.location.pathname, '/form');
  assert.ok(
    window.document.querySelector('[role="dialog"]'),
    'Expected dialog to appear when navigating away from a dirty form',
  );

  await act(async () => {
    root.unmount();
  });
})();

await (async () => {
  // Keep editing: dialog closes, route and form state preserved
  const { root, router, window } = await renderTest();

  await clickById(window, 'make-dirty');

  await act(async () => {
    await router.navigate('/other');
    await renderTick();
  });

  const keepEditingBtn = findDialogButton(window, 'Keep editing');

  assert.ok(keepEditingBtn, 'Expected Keep editing button in dialog');

  await act(async () => {
    keepEditingBtn!.dispatchEvent(
      new window.MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        button: 0,
      }),
    );
    await renderTick();
  });

  assert.equal(router.state.location.pathname, '/form');
  assert.ok(
    !window.document.querySelector('[role="dialog"]'),
    'Expected dialog to close after Keep editing',
  );

  await act(async () => {
    root.unmount();
  });
})();

await (async () => {
  // Discard changes: pending navigation completes
  const { root, router, window } = await renderTest();

  await clickById(window, 'make-dirty');

  await act(async () => {
    await router.navigate('/other');
    await renderTick();
  });

  const discardBtn = findDialogButton(window, 'Discard changes');

  assert.ok(discardBtn, 'Expected Discard changes button in dialog');

  await act(async () => {
    discardBtn!.dispatchEvent(
      new window.MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        button: 0,
      }),
    );
    await renderTick();
    await renderTick();
  });

  assert.equal(router.state.location.pathname, '/other');

  await act(async () => {
    root.unmount();
  });
})();

await (async () => {
  // beforeunload: only active while dirty, cleared after reset
  const { root, window } = await renderTest();

  const makeBeforeUnloadEvent = () =>
    new window.Event('beforeunload', {
      cancelable: true,
    }) as BeforeUnloadEvent;

  const cleanEvent = makeBeforeUnloadEvent();

  await act(async () => {
    window.dispatchEvent(cleanEvent);
    await renderTick();
  });

  assert.equal(
    cleanEvent.defaultPrevented,
    false,
    'Expected beforeunload to not be prevented when clean',
  );

  await clickById(window, 'make-dirty');

  const dirtyEvent = makeBeforeUnloadEvent();

  await act(async () => {
    window.dispatchEvent(dirtyEvent);
    await renderTick();
  });

  assert.equal(
    dirtyEvent.defaultPrevented,
    true,
    'Expected beforeunload to be prevented when dirty',
  );

  await clickById(window, 'make-clean');

  const cleanAgainEvent = makeBeforeUnloadEvent();

  await act(async () => {
    window.dispatchEvent(cleanAgainEvent);
    await renderTick();
  });

  assert.equal(
    cleanAgainEvent.defaultPrevented,
    false,
    'Expected beforeunload to not be prevented after reset to clean',
  );

  await act(async () => {
    root.unmount();
  });
})();

await (async () => {
  // Reset: dirty→clean removes all blocking behaviour
  const { root, router, window } = await renderTest();

  await clickById(window, 'make-dirty');

  await act(async () => {
    await router.navigate('/other');
    await renderTick();
  });

  const keepEditingBtn = findDialogButton(window, 'Keep editing');

  assert.ok(keepEditingBtn, 'Expected Keep editing button');

  await act(async () => {
    keepEditingBtn!.dispatchEvent(
      new window.MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        button: 0,
      }),
    );
    await renderTick();
  });

  assert.equal(router.state.location.pathname, '/form');

  await clickById(window, 'make-clean');

  await act(async () => {
    await router.navigate('/other');
    await renderTick();
  });

  assert.equal(
    router.state.location.pathname,
    '/other',
    'Expected navigation to succeed after reset',
  );
  assert.ok(
    !window.document.querySelector('[role="dialog"]'),
    'Expected no dialog after reset',
  );

  await act(async () => {
    root.unmount();
  });
})();

await (async () => {
  // Repeated navigation attempts: each attempt while dirty shows dialog
  const { root, router, window } = await renderTest();

  await clickById(window, 'make-dirty');

  await act(async () => {
    await router.navigate('/other');
    await renderTick();
  });

  assert.ok(
    window.document.querySelector('[role="dialog"]'),
    'Expected dialog on first navigation attempt',
  );

  const keepEditing1 = findDialogButton(window, 'Keep editing');

  assert.ok(keepEditing1, 'Expected Keep editing button on first attempt');

  await act(async () => {
    keepEditing1!.dispatchEvent(
      new window.MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        button: 0,
      }),
    );
    await renderTick();
  });

  assert.equal(router.state.location.pathname, '/form');

  await act(async () => {
    await router.navigate('/other');
    await renderTick();
  });

  assert.ok(
    window.document.querySelector('[role="dialog"]'),
    'Expected dialog on second navigation attempt',
  );

  const discardBtn2 = findDialogButton(window, 'Discard changes');

  assert.ok(discardBtn2, 'Expected Discard changes button on second attempt');

  await act(async () => {
    discardBtn2!.dispatchEvent(
      new window.MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        button: 0,
      }),
    );
    await renderTick();
    await renderTick();
  });

  assert.equal(router.state.location.pathname, '/other');

  await act(async () => {
    root.unmount();
  });
})();

console.log('useDirtyFormGuard tests passed');

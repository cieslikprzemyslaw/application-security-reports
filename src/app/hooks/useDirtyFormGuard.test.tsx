import { act } from 'react';

import assert from 'node:assert/strict';

import {
  clickById,
  findDialogButton,
  renderTest,
  renderTick,
} from './useDirtyFormGuard.test.helpers';

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
  // Reset after save: clean state cancels the pending navigation and clears blockers
  const { root, router, window } = await renderTest();

  await clickById(window, 'make-dirty');

  await act(async () => {
    await router.navigate('/other');
    await renderTick();
  });

  await clickById(window, 'make-clean');

  assert.equal(router.state.location.pathname, '/form');
  assert.ok(
    !window.document.querySelector('[role="dialog"]'),
    'Expected dialog to close after save',
  );

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

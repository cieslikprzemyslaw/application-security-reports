import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';

import { defaultTheme } from '~/theme';

import Topbar from './topbar.component';

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
    { url: 'http://localhost' },
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

const renderTopbar = async (isSidebarOpen = false) => {
  const { container, window } = setupDom();

  assert.ok(container, 'Expected root container to exist');

  const root = createRoot(container);
  let menuClickCount = 0;

  await act(async () => {
    root.render(
      <ThemeProvider theme={defaultTheme}>
        <Topbar
          title="AppSec Report Builder"
          onMenuClick={() => {
            menuClickCount += 1;
          }}
          menuButtonControls="application-sidebar"
          menuButtonExpanded={isSidebarOpen}
          search={<input aria-label="Search" placeholder="Search" />}
          actions={<button type="button">New assessment</button>}
          userMenu={<button type="button">PC</button>}
        />
      </ThemeProvider>,
    );
    await renderTick();
  });

  return {
    container,
    root,
    window,
    getMenuClickCount: () => menuClickCount,
  };
};

await (async () => {
  {
    const { container, root, window, getMenuClickCount } = await renderTopbar();
    const menuButton = container.querySelector(
      'button[aria-label="Open navigation menu"]',
    ) as HTMLButtonElement | null;

    assert.ok(menuButton, 'Expected menu button to render');
    assert.equal(
      menuButton?.getAttribute('aria-controls'),
      'application-sidebar',
    );
    assert.equal(menuButton?.getAttribute('aria-expanded'), 'false');
    assert.equal(menuButton?.tagName, 'BUTTON');

    menuButton?.focus();
    assert.equal(window.document.activeElement, menuButton);

    await act(async () => {
      menuButton?.dispatchEvent(
        new window.MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          button: 0,
        }),
      );
      await renderTick();
    });

    assert.equal(getMenuClickCount(), 1);

    await act(async () => {
      root.unmount();
    });
  }

  {
    const { container, root } = await renderTopbar(true);
    const menuButton = container.querySelector(
      'button[aria-label="Open navigation menu"]',
    ) as HTMLButtonElement | null;

    assert.equal(menuButton?.getAttribute('aria-expanded'), 'true');

    await act(async () => {
      root.unmount();
    });
  }

  {
    const topbarStyles = readFileSync(
      new URL('./topbar.styled.ts', import.meta.url),
      'utf8',
    );

    assert.ok(topbarStyles.includes('position: sticky;'));
    assert.ok(topbarStyles.includes('top: 0;'));
    assert.ok(topbarStyles.includes('.topbar-menu-button:focus-visible'));
    assert.ok(topbarStyles.includes('@media ${mq.min.laptop}'));
    assert.ok(topbarStyles.includes('display: none;'));
  }
})();

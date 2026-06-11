import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

import { defaultTheme } from '~/theme';

import AppLayout from './appLayout.component';

const renderTick = () => new Promise<void>(resolve => setTimeout(resolve, 0));

const setGlobal = <K extends PropertyKey>(key: K, value: unknown) => {
  Object.defineProperty(globalThis, key, {
    value,
    configurable: true,
    writable: true,
  });
};

const setupDom = (pathname: string) => {
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="root"></div></body></html>',
    { url: `http://localhost${pathname}` },
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
  };
};

const TestApp = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<AppLayout />}>
        <Route
          path="/dashboard"
          element={<h1 className="test-page-title">Dashboard page</h1>}
        />
        <Route
          path="/companies"
          element={<h1 className="test-page-title">Companies page</h1>}
        />
        <Route
          path="*"
          element={
            <h1 className="test-page-title">Requested page not found</h1>
          }
        />
      </Route>
    </Routes>
  </BrowserRouter>
);

const renderApp = async (pathname: string) => {
  const { container } = setupDom(pathname);

  assert.ok(container, 'Expected root container to exist');

  const root = createRoot(container);

  await act(async () => {
    root.render(
      <ThemeProvider theme={defaultTheme}>
        <TestApp />
      </ThemeProvider>,
    );
    await renderTick();
  });

  return { container, root };
};

await (async () => {
  {
    const { container, root } = await renderApp('/dashboard');

    assert.ok(container.querySelector('.sidebar'));
    assert.ok(container.querySelector('.topbar'));
    assert.ok(container.querySelector('.page-content'));
    assert.ok(textContent(container).includes('Dashboard page'));
    assert.equal(
      container
        .querySelector('.app-shell-sidebar')
        ?.getAttribute('data-is-open'),
      'false',
    );

    await act(async () => {
      root.unmount();
    });
  }

  {
    const { container, root } = await renderApp('/dashboard');
    const openButton = container.querySelector(
      'button[aria-label="Open navigation menu"]',
    ) as HTMLButtonElement | null;

    assert.ok(openButton, 'Expected mobile menu button');
    assert.equal(
      openButton?.getAttribute('aria-controls'),
      'app-layout-sidebar',
    );
    assert.equal(openButton?.getAttribute('aria-expanded'), 'false');
    assert.equal(openButton?.tagName, 'BUTTON');

    await act(async () => {
      openButton?.dispatchEvent(
        new window.MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          button: 0,
        }),
      );
      await renderTick();
    });

    assert.equal(
      container
        .querySelector('.app-shell-sidebar')
        ?.getAttribute('data-is-open'),
      'true',
    );
    assert.equal(openButton?.getAttribute('aria-expanded'), 'true');

    const closeButton = container.querySelector(
      'button[aria-label="Close navigation"]',
    ) as HTMLButtonElement | null;

    assert.ok(closeButton, 'Expected sidebar close button');

    await act(async () => {
      closeButton?.dispatchEvent(
        new window.MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          button: 0,
        }),
      );
      await renderTick();
    });

    assert.equal(
      container
        .querySelector('.app-shell-sidebar')
        ?.getAttribute('data-is-open'),
      'false',
    );

    await act(async () => {
      root.unmount();
    });
  }

  {
    const { container, root } = await renderApp('/dashboard');
    const openButton = container.querySelector(
      'button[aria-label="Open navigation menu"]',
    ) as HTMLButtonElement | null;

    await act(async () => {
      openButton?.dispatchEvent(
        new window.MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          button: 0,
        }),
      );
      await renderTick();
    });

    const companiesLink = container.querySelector('a[href="/companies"]');

    assert.ok(companiesLink, 'Expected companies link');

    await act(async () => {
      companiesLink?.dispatchEvent(
        new window.MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          button: 0,
        }),
      );
      await renderTick();
    });

    assert.equal(window.location.pathname, '/companies');
    assert.ok(textContent(container).includes('Companies page'));
    assert.equal(
      container
        .querySelector('.app-shell-sidebar')
        ?.getAttribute('data-is-open'),
      'false',
    );

    await act(async () => {
      root.unmount();
    });
  }

  {
    const appShellStyles = readFileSync(
      new URL('../appShell/appShell.styled.ts', import.meta.url),
      'utf8',
    );
    const topbarStyles = readFileSync(
      new URL('../topbar/topbar.styled.ts', import.meta.url),
      'utf8',
    );
    const reportPreviewStyles = readFileSync(
      new URL(
        '../../components/appsec/reportPreviewShell/reportPreviewShell.styled.ts',
        import.meta.url,
      ),
      'utf8',
    );

    assert.ok(appShellStyles.includes('@media print'));
    assert.ok(appShellStyles.includes('.app-shell-sidebar'));
    assert.ok(appShellStyles.includes('.app-shell-topbar'));
    assert.ok(topbarStyles.includes('position: sticky;'));
    assert.ok(topbarStyles.includes('top: 0;'));
    assert.ok(topbarStyles.includes('.topbar-menu-button:focus-visible'));
    assert.ok(reportPreviewStyles.includes('@media print'));
    assert.ok(reportPreviewStyles.includes('.report-preview-shell-header'));
  }
})();

function textContent(container: HTMLElement) {
  return container.textContent ?? '';
}

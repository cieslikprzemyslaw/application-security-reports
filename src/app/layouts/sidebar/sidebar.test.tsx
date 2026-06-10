import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';
import React, { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

import { routes } from '~/routes';
import { defaultTheme } from '~/theme';

import Sidebar from './sidebar.component';

import type { SidebarNavigationGroup } from './sidebar.type';

const renderTick = () => new Promise<void>(resolve => setTimeout(resolve, 0));

const setGlobal = <K extends PropertyKey>(key: K, value: unknown) => {
  Object.defineProperty(globalThis, key, {
    value,
    configurable: true,
    writable: true,
  });
};

const navigationGroups: SidebarNavigationGroup[] = [
  {
    id: 'workspace',
    items: [
      { id: 'dashboard', label: 'Dashboard', href: routes.dashboard },
      { id: 'companies', label: 'Companies', href: routes.companies },
      { id: 'assessments', label: 'Assessments', href: routes.assessments },
      { id: 'threats', label: 'Threats', href: routes.threats },
      { id: 'reports', label: 'Reports', href: routes.reports },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [{ id: 'settings', label: 'Settings', href: routes.settings }],
  },
];

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

const SidebarFixture = ({
  initialIsOpen,
  onClose,
}: {
  initialIsOpen: boolean;
  onClose: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(initialIsOpen);

  const handleClose = () => {
    onClose();
    setIsOpen(false);
  };

  return (
    <BrowserRouter>
      <Sidebar
        brand={<strong>AppSec Reports</strong>}
        navigationGroups={navigationGroups}
        footer={<small>Local workspace</small>}
        isOpen={isOpen}
        onClose={handleClose}
      />

      <Routes>
        <Route
          path="/dashboard"
          element={<h1 className="test-page-title">Dashboard page</h1>}
        />
        <Route
          path="/companies"
          element={<h1 className="test-page-title">Companies page</h1>}
        />
        <Route
          path="/assessments"
          element={<h1 className="test-page-title">Assessments page</h1>}
        />
        <Route
          path="/assessments/:assessmentId"
          element={<h1 className="test-page-title">Assessment details page</h1>}
        />
        <Route
          path="/reports"
          element={<h1 className="test-page-title">Reports page</h1>}
        />
        <Route
          path="/reports/:reportId"
          element={<h1 className="test-page-title">Report details page</h1>}
        />
        <Route
          path="/settings"
          element={<h1 className="test-page-title">Settings page</h1>}
        />
        <Route
          path="/threats"
          element={<h1 className="test-page-title">Threats page</h1>}
        />
        <Route
          path="*"
          element={<h1 className="test-page-title">Not found</h1>}
        />
      </Routes>
    </BrowserRouter>
  );
};

const renderApp = async (
  pathname: string,
  initialIsOpen = false,
  onClose = () => undefined,
) => {
  const { container } = setupDom(pathname);

  assert.ok(container, 'Expected root container to exist');

  const root = createRoot(container);

  await act(async () => {
    root.render(
      <ThemeProvider theme={defaultTheme}>
        <SidebarFixture initialIsOpen={initialIsOpen} onClose={onClose} />
      </ThemeProvider>,
    );
    await renderTick();
  });

  return { container, root };
};

const click = async (element: Element | null) => {
  assert.ok(element, 'Expected element to exist');

  await act(async () => {
    element.dispatchEvent(
      new window.MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        button: 0,
      }),
    );
    await renderTick();
  });
};

await (async () => {
  {
    const { container, root } = await renderApp('/dashboard');

    assert.equal(
      container.querySelector('a[href="/dashboard"]')?.getAttribute('href'),
      routes.dashboard,
    );
    assert.equal(
      container.querySelector('a[href="/companies"]')?.getAttribute('href'),
      routes.companies,
    );
    assert.equal(
      container.querySelector('a[href="/assessments"]')?.getAttribute('href'),
      routes.assessments,
    );
    assert.equal(
      container.querySelector('a[href="/threats"]')?.getAttribute('href'),
      routes.threats,
    );
    assert.equal(
      container.querySelector('a[href="/reports"]')?.getAttribute('href'),
      routes.reports,
    );
    assert.equal(
      container.querySelector('a[href="/settings"]')?.getAttribute('href'),
      routes.settings,
    );

    const dashboardLink = container.querySelector('a[href="/dashboard"]');

    assert.equal(dashboardLink?.getAttribute('aria-current'), 'page');
    assert.ok(
      dashboardLink?.className.includes('sidebar-link--active'),
      'Expected dashboard link to have the active class',
    );

    await act(async () => {
      root.unmount();
    });
  }

  {
    const { container, root } = await renderApp('/assessments/asm_123');

    const assessmentsLink = container.querySelector('a[href="/assessments"]');

    assert.equal(assessmentsLink?.getAttribute('aria-current'), 'page');
    assert.ok(
      assessmentsLink?.className.includes('sidebar-link--active'),
      'Expected Assessments to remain active for detail routes',
    );

    await act(async () => {
      root.unmount();
    });
  }

  {
    const { container, root } = await renderApp('/reports/rpt_123');

    const reportsLink = container.querySelector('a[href="/reports"]');

    assert.equal(reportsLink?.getAttribute('aria-current'), 'page');
    assert.ok(
      reportsLink?.className.includes('sidebar-link--active'),
      'Expected Reports to remain active for detail routes',
    );

    await act(async () => {
      root.unmount();
    });
  }

  {
    let closeCount = 0;

    const { container, root } = await renderApp('/dashboard', true, () => {
      closeCount += 1;
    });
    const companiesLink = container.querySelector('a[href="/companies"]');

    await click(companiesLink);

    assert.equal(window.location.pathname, '/companies');
    assert.ok(
      container.textContent?.includes('Companies page'),
      'Expected client-side navigation without a full-page reload',
    );
    assert.equal(
      container.querySelector('.sidebar')?.getAttribute('data-is-open'),
      'false',
    );
    assert.equal(closeCount, 1);

    await act(async () => {
      root.unmount();
    });
  }

  {
    let closeCount = 0;

    const { container, root } = await renderApp('/dashboard', false, () => {
      closeCount += 1;
    });
    const threatsLink = container.querySelector('a[href="/threats"]');

    await click(threatsLink);

    assert.equal(window.location.pathname, '/threats');
    assert.equal(closeCount, 0);
    assert.equal(
      container.querySelector('.sidebar')?.getAttribute('data-is-open'),
      'false',
    );

    await act(async () => {
      root.unmount();
    });
  }

  console.log('sidebar checks passed');
})();

import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

import { routes } from '~/routes';
import { defaultTheme } from '~/theme';

import AppRouter from '~/app/appRouter';
import Dashboard from '~/app/pages/dashboard';

const renderTick = () => new Promise<void>(resolve => setTimeout(resolve, 0));

const originalFetch = globalThis.fetch;

const setFetch = (value: typeof fetch) => {
  Object.defineProperty(globalThis, 'fetch', {
    value,
    configurable: true,
    writable: true,
  });
};

const restoreFetch = () => {
  setFetch(originalFetch);
};

const createJsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json', ...init.headers },
    ...init,
  });

const setGlobal = <K extends PropertyKey>(key: K, value: unknown) => {
  Object.defineProperty(globalThis, key, {
    value,
    configurable: true,
    writable: true,
  });
};

const setupDom = (
  pathname = '/',
  localStorageEntries?: Record<string, string>,
) => {
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

  if (localStorageEntries) {
    for (const [key, value] of Object.entries(localStorageEntries)) {
      window.localStorage.setItem(key, value);
    }
  }

  const container = window.document.getElementById('root');
  assert.ok(container, 'Expected root container to exist');

  return { container, window };
};

const renderDashboard = async (
  pathname = '/dashboard',
  localStorageEntries?: Record<string, string>,
) => {
  const { container } = setupDom(pathname, localStorageEntries);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      <ThemeProvider theme={defaultTheme}>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </ThemeProvider>,
    );
    await renderTick();
    await renderTick();
  });

  return { container, root };
};

const renderComponent = async (
  element: React.ReactNode,
  localStorageEntries?: Record<string, string>,
  pathname = '/',
) => {
  const { container, window } = setupDom(pathname, localStorageEntries);
  const root = createRoot(container);

  await act(async () => {
    root.render(<ThemeProvider theme={defaultTheme}>{element}</ThemeProvider>);
    await renderTick();
    await renderTick();
  });

  return { container, root, window };
};

const textContent = (container: HTMLElement) => container.textContent ?? '';

await (async () => {
  {
    const { container, root } = await renderComponent(
      <Dashboard companies={[]} onCreateCompany={() => undefined} />,
    );

    assert.ok(textContent(container).includes('Recent companies'));
    assert.ok(textContent(container).includes('No companies yet'));
    assert.ok(textContent(container).includes('Create company'));

    await act(async () => {
      root.unmount();
    });
  }

  {
    const openedCompanyIds: string[] = [];

    const { container, root } = await renderComponent(
      <Dashboard
        companies={[
          {
            id: 'cmp_1',
            name: 'Northstar Digital',
            assessmentCount: 6,
            latestAssessment: {
              id: 'asm_1',
              name: 'Customer Services Portal',
              status: 'in-progress',
            },
          },
          {
            id: 'cmp_2',
            name: 'Meridian Finance',
            assessmentCount: 4,
            latestAssessment: {
              id: 'asm_2',
              name: 'Online Banking Portal',
              status: 'completed',
            },
          },
          {
            id: 'cmp_3',
            name: 'Summit Health',
            assessmentCount: 2,
          },
        ]}
        onOpenCompany={company => openedCompanyIds.push(company.id)}
      />,
      {
        'appsec-company-switcher-recents': JSON.stringify(['cmp_2', 'cmp_1']),
        'appsec-company-switcher-recent-open-times': JSON.stringify({
          cmp_2: '2026-06-14T16:45:00.000Z',
          cmp_1: '2026-06-15T08:15:00.000Z',
        }),
      },
    );

    assert.deepEqual(
      Array.from(container.querySelectorAll('.dashboard-company-name')).map(
        node => node.textContent,
      ),
      ['Meridian Finance', 'Northstar Digital', 'Summit Health'],
    );
    assert.ok(textContent(container).includes('Active assessments'));
    assert.ok(textContent(container).includes('Latest assessment'));

    const companyRows = Array.from(
      container.querySelectorAll('.dashboard-recent-company-row'),
    ) as HTMLButtonElement[];

    assert.equal(companyRows[0]?.tagName, 'BUTTON');
    assert.equal(companyRows[0]?.getAttribute('type'), 'button');

    companyRows[0]?.focus();
    assert.equal(window.document.activeElement, companyRows[0]);

    await act(async () => {
      companyRows[0]?.dispatchEvent(
        new window.MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          button: 0,
        }),
      );
      await renderTick();
    });

    assert.deepEqual(openedCompanyIds, ['cmp_2']);

    await act(async () => {
      root.unmount();
    });
  }

  {
    const originalInnerWidth = window.innerWidth;
    try {
      Object.defineProperty(window, 'innerWidth', {
        value: 320,
        configurable: true,
      });

      const { container, root } = await renderComponent(
        <Dashboard
          companies={[
            {
              id: 'cmp_1',
              name: 'Northstar Digital',
              assessmentCount: 6,
              latestAssessment: {
                id: 'asm_1',
                name: 'Customer Services Portal',
                status: 'in-progress',
              },
            },
          ]}
          onOpenCompany={() => undefined}
        />,
      );

      assert.equal(
        container.querySelectorAll('.dashboard-recent-company-row').length,
        1,
      );
      assert.ok(container.querySelector('.dashboard-company-details'));
      assert.ok(textContent(container).includes('Customer Services Portal'));
      assert.ok(textContent(container).includes('Last opened —'));

      await act(async () => {
        root.unmount();
      });
    } finally {
      Object.defineProperty(window, 'innerWidth', {
        value: originalInnerWidth,
        configurable: true,
      });
    }
  }

  {
    setFetch(async input => {
      assert.equal(String(input), '/api/companies');
      return createJsonResponse({
        data: [
          {
            id: 'cmp_2',
            name: 'Meridian Finance',
            website: 'https://meridian.example',
            contactEmail: 'security@meridian.example',
            assessmentCount: 1,
            createdAt: '2026-06-02T00:00:00.000Z',
            updatedAt: '2026-06-11T00:00:00.000Z',
          },
          {
            id: 'cmp_1',
            name: 'Northwind Labs',
            website: 'https://northwind.example',
            contactEmail: 'security@northwind.example',
            assessmentCount: 2,
            createdAt: '2026-06-01T00:00:00.000Z',
            updatedAt: '2026-06-10T00:00:00.000Z',
          },
          {
            id: 'cmp_3',
            name: 'Summit Health',
            website: 'https://summit.example',
            contactEmail: 'security@summit.example',
            assessmentCount: 3,
            createdAt: '2026-06-03T00:00:00.000Z',
            updatedAt: '2026-06-12T00:00:00.000Z',
          },
        ],
      });
    });

    try {
      const { container, root, window } = await renderDashboard('/dashboard', {
        'appsec-company-switcher-recents': JSON.stringify(['cmp_2', 'cmp_1']),
        'appsec-company-switcher-recent-open-times': JSON.stringify({
          cmp_2: '2026-06-14T16:45:00.000Z',
          cmp_1: '2026-06-15T08:15:00.000Z',
        }),
      });

      assert.equal(window.location.pathname, '/dashboard');
      assert.ok(textContent(container).includes('Recent companies'));

      const companyRows = Array.from(
        container.querySelectorAll('.dashboard-recent-company-row'),
      ) as HTMLButtonElement[];

      await act(async () => {
        companyRows[0]?.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
        await renderTick();
        await renderTick();
      });

      assert.equal(
        window.location.pathname,
        routes.companyWorkspaceOverview('cmp_2'),
      );

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    setFetch(async () => {
      throw new Error('Unable to load companies.');
    });

    try {
      const { container, root } = await renderDashboard('/dashboard');

      assert.ok(
        textContent(container).includes('Unable to load recent companies'),
      );
      assert.ok(textContent(container).includes('Retry'));

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }
})();

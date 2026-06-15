import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

import { AppLayout } from '~/app/layouts';
import { routes } from '~/routes';
import { defaultTheme } from '~/theme';

import AppRouter from './appRouter';
import { reportCover } from './appData';

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

const createJsonResponse = (body: unknown, init: ResponseInit = {}): Response =>
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

const renderApp = async (pathname: string, settle = true) => {
  const { container } = setupDom(pathname);

  assert.ok(container, 'Expected root container to exist');

  const root = createRoot(container);

  await act(async () => {
    root.render(
      <ThemeProvider theme={defaultTheme}>
        <AppRouter />
      </ThemeProvider>,
    );
    if (settle) {
      await renderTick();
      await renderTick();
    }
  });

  return { container, root };
};

const textContent = (container: HTMLElement) => container.textContent ?? '';

const renderRouteErrorFixture = async (pathname: string) => {
  const { container } = setupDom(pathname);

  assert.ok(container, 'Expected root container to exist');

  const root = createRoot(container);
  const originalConsoleError = console.error;
  console.error = () => undefined;

  const ThrowingRoute = () => {
    throw new Error('Simulated route failure');
  };

  try {
    await act(async () => {
      root.render(
        <ThemeProvider theme={defaultTheme}>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route
                  path="/dashboard"
                  element={<h1>Security Dashboard</h1>}
                />
                <Route path="/broken" element={<ThrowingRoute />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ThemeProvider>,
      );
      await renderTick();
      await renderTick();
    });
  } finally {
    console.error = originalConsoleError;
  }

  return { container, root };
};

const renderRouteLoadingFixture = async (pathname: string) => {
  const { container } = setupDom(pathname);

  assert.ok(container, 'Expected root container to exist');

  const root = createRoot(container);
  const DelayedRoute = React.lazy(
    () =>
      new Promise<{ default: React.ComponentType }>(resolve => {
        window.setTimeout(() => {
          resolve({
            default: () => <h1 className="test-page-title">Loaded page</h1>,
          });
        }, 50);
      }),
  );

  await act(async () => {
    root.render(
      <ThemeProvider theme={defaultTheme}>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DelayedRoute />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>,
    );
    await renderTick();
  });

  return { container, root };
};

const assertRouteRenders = async (pathname: string, expectedText: string) => {
  const { container, root } = await renderApp(pathname);

  assert.ok(
    textContent(container).includes(expectedText),
    `Expected route ${pathname} to contain "${expectedText}"`,
  );

  await act(async () => {
    root.unmount();
  });
};

await (async () => {
  {
    const { container, root } = await renderRouteLoadingFixture('/dashboard');

    assert.ok(
      container.querySelector('[role="status"]'),
      'Expected route loading view to expose a status role',
    );
    assert.ok(
      textContent(container).includes('Loading route content'),
      'Expected the shared loading view to render',
    );

    await act(async () => {
      await new Promise(resolve => window.setTimeout(resolve, 60));
      await renderTick();
    });

    assert.ok(textContent(container).includes('Loaded page'));

    await act(async () => {
      root.unmount();
    });
  }

  {
    setFetch(async () =>
      createJsonResponse({
        data: [
          {
            id: 'cmp_1',
            name: 'Northwind Labs',
            website: 'https://northwind.example',
            contactEmail: 'security@northwind.example',
            assessmentCount: 2,
            createdAt: '2026-06-01T00:00:00.000Z',
            updatedAt: '2026-06-10T00:00:00.000Z',
          },
        ],
      }),
    );

    try {
      const { container, root } = await renderApp('/');

      assert.equal(window.location.pathname, '/dashboard');
      assert.ok(textContent(container).includes('Security Dashboard'));

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    setFetch(async () =>
      createJsonResponse({
        data: [
          {
            id: 'cmp_1',
            name: 'Northwind Labs',
            website: 'https://northwind.example',
            contactEmail: 'security@northwind.example',
            assessmentCount: 2,
            createdAt: '2026-06-01T00:00:00.000Z',
            updatedAt: '2026-06-10T00:00:00.000Z',
          },
        ],
      }),
    );

    try {
      await assertRouteRenders('/dashboard', 'Security Dashboard');
    } finally {
      restoreFetch();
    }
  }

  {
    setFetch(async () => createJsonResponse({ data: [] }));

    try {
      const { container, root } = await renderApp('/dashboard');

      assert.ok(textContent(container).includes('Welcome to AppSec Reports'));
      assert.ok(textContent(container).includes('Create company'));

      const createCompanyButton = container.querySelector(
        '.dashboard-welcome-card button',
      ) as HTMLButtonElement | null;

      assert.ok(createCompanyButton, 'Expected a create company action');

      await act(async () => {
        createCompanyButton.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
        await renderTick();
        await renderTick();
      });

      assert.equal(window.location.pathname, '/companies');
      assert.ok(
        window.document.querySelector('input#company-name'),
        'Expected the create company drawer to open',
      );

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    setFetch(async () =>
      createJsonResponse({
        data: [
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
            id: 'cmp_2',
            name: 'Meridian Finance',
            website: 'https://meridian.example',
            contactEmail: 'security@meridian.example',
            assessmentCount: 1,
            createdAt: '2026-06-02T00:00:00.000Z',
            updatedAt: '2026-06-11T00:00:00.000Z',
          },
        ],
      }),
    );

    try {
      const { container, root } = await renderApp('/companies');

      assert.ok(textContent(container).includes('Companies'));
      assert.ok(textContent(container).includes('Northwind Labs'));

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    let requestCount = 0;

    setFetch(async input => {
      requestCount += 1;

      if (requestCount === 1 || requestCount === 2) {
        return createJsonResponse({ data: [] });
      }

      if (String(input) === '/api/companies' && requestCount === 3) {
        return createJsonResponse({
          data: {
            id: 'cmp_2',
            name: 'Northwind Labs',
            website: 'https://northwind.example',
            contactEmail: 'security@northwind.example',
            assessmentCount: 1,
            createdAt: '2026-06-01T00:00:00.000Z',
            updatedAt: '2026-06-10T00:00:00.000Z',
          },
        });
      }

      return createJsonResponse({
        data: [
          {
            id: 'cmp_2',
            name: 'Northwind Labs',
            website: 'https://northwind.example',
            contactEmail: 'security@northwind.example',
            assessmentCount: 1,
            createdAt: '2026-06-01T00:00:00.000Z',
            updatedAt: '2026-06-10T00:00:00.000Z',
          },
        ],
      });
    });

    try {
      const { container, root } = await renderApp('/companies');

      const newCompanyButton = Array.from(
        container.querySelectorAll('button'),
      ).find(button => button.textContent?.includes('New company'));

      assert.ok(newCompanyButton, 'Expected a new company action');

      await act(async () => {
        newCompanyButton.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
        await renderTick();
      });

      const nameInput = window.document.querySelector(
        'input#company-name',
      ) as HTMLInputElement | null;

      assert.ok(nameInput, 'Expected the company name field');

      await act(async () => {
        nameInput!.value = 'Northwind Labs';
        nameInput!.dispatchEvent(
          new window.Event('input', {
            bubbles: true,
            cancelable: true,
          }),
        );
        await renderTick();
      });

      const createButton = window.document.querySelector(
        'button[type="submit"]',
      ) as HTMLButtonElement | null;

      assert.ok(createButton, 'Expected a create company action');

      await act(async () => {
        createButton.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
        await renderTick();
        await renderTick();
        await renderTick();
      });

      assert.ok(textContent(container).includes('Northwind Labs'));
      assert.equal(
        window.location.pathname,
        routes.companyWorkspaceOverview('cmp_2'),
      );
      assert.ok(
        !textContent(container).includes('Company not found'),
        'Expected the refreshed company list to be used before navigation',
      );

      const activeCompanyName = container.querySelector(
        '.sidebar-company-switcher-name',
      );

      assert.ok(activeCompanyName, 'Expected the active company label');
      assert.equal(activeCompanyName?.textContent, 'Northwind Labs');

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    setFetch(async input => {
      assert.equal(String(input), '/api/companies');
      return createJsonResponse({
        data: [
          {
            id: 'cmp_1',
            name: 'Northwind Labs',
            website: 'https://northwind.example',
            contactEmail: 'security@northwind.example',
            assessmentCount: 2,
            createdAt: '2026-06-01T00:00:00.000Z',
            updatedAt: '2026-06-10T00:00:00.000Z',
          },
        ],
      });
    });

    try {
      const { container, root } = await renderApp(
        routes.companyWorkspaceOverview('cmp_1'),
      );

      assert.ok(textContent(container).includes('Security Dashboard'));
      assert.equal(
        window.location.pathname,
        routes.companyWorkspaceOverview('cmp_1'),
      );
      assert.equal(
        container
          .querySelector('a[href="/companies/cmp_1/overview"]')
          ?.getAttribute('aria-current'),
        'page',
      );
      assert.ok(container.querySelector('a[href="/companies/cmp_1/overview"]'));
      assert.ok(
        container.querySelector('a[href="/companies/cmp_1/assessments"]'),
      );
      assert.ok(container.querySelector('a[href="/companies/cmp_1/reports"]'));
      assert.ok(container.querySelector('a[href="/companies/cmp_1/activity"]'));

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    setFetch(async input => {
      assert.equal(String(input), '/api/companies');
      return createJsonResponse({
        data: [
          {
            id: 'cmp_1',
            name: 'Northwind Labs',
            website: 'https://northwind.example',
            contactEmail: 'security@northwind.example',
            assessmentCount: 2,
            createdAt: '2026-06-01T00:00:00.000Z',
            updatedAt: '2026-06-10T00:00:00.000Z',
          },
        ],
      });
    });

    try {
      const { container, root } = await renderApp(
        routes.companyWorkspaceAssessments('cmp_1'),
      );

      assert.ok(
        textContent(container).includes(
          'All application security assessments across your workspace.',
        ),
      );

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    setFetch(async input => {
      assert.equal(String(input), '/api/companies');
      return createJsonResponse({
        data: [
          {
            id: 'cmp_1',
            name: 'Northwind Labs',
            website: 'https://northwind.example',
            contactEmail: 'security@northwind.example',
            assessmentCount: 2,
            createdAt: '2026-06-01T00:00:00.000Z',
            updatedAt: '2026-06-10T00:00:00.000Z',
          },
        ],
      });
    });

    try {
      const { container, root } = await renderApp(
        routes.companyWorkspaceReports('cmp_1'),
      );

      assert.ok(textContent(container).includes('Report Preview'));
      assert.equal(
        window.location.pathname,
        routes.companyWorkspaceReports('cmp_1'),
      );

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    setFetch(async input => {
      assert.equal(String(input), '/api/companies');
      return createJsonResponse({
        data: [
          {
            id: 'cmp_1',
            name: 'Northwind Labs',
            website: 'https://northwind.example',
            contactEmail: 'security@northwind.example',
            assessmentCount: 2,
            createdAt: '2026-06-01T00:00:00.000Z',
            updatedAt: '2026-06-10T00:00:00.000Z',
          },
        ],
      });
    });

    try {
      const { container, root } = await renderApp(
        routes.companyWorkspaceActivity('cmp_1'),
      );

      assert.ok(textContent(container).includes('Activity'));
      assert.ok(textContent(container).includes('Recent actions'));

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    setFetch(async input => {
      assert.equal(String(input), '/api/companies');
      return createJsonResponse({
        data: [
          {
            id: 'cmp_1',
            name: 'Northwind Labs',
            website: 'https://northwind.example',
            contactEmail: 'security@northwind.example',
            assessmentCount: 2,
            createdAt: '2026-06-01T00:00:00.000Z',
            updatedAt: '2026-06-10T00:00:00.000Z',
          },
        ],
      });
    });

    try {
      const { container, root } = await renderApp('/companies/cmp_1');

      assert.equal(
        window.location.pathname,
        routes.companyWorkspaceOverview('cmp_1'),
      );
      assert.ok(textContent(container).includes('Security Dashboard'));

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    setFetch(async input => {
      assert.equal(String(input), '/api/companies');
      return createJsonResponse({
        data: [
          {
            id: 'cmp_1',
            name: 'Northwind Labs',
            website: 'https://northwind.example',
            contactEmail: 'security@northwind.example',
            assessmentCount: 2,
            createdAt: '2026-06-01T00:00:00.000Z',
            updatedAt: '2026-06-10T00:00:00.000Z',
          },
        ],
      });
    });

    try {
      const { container, root } = await renderApp(
        '/companies/cmp_missing/overview',
      );

      assert.ok(textContent(container).includes('Company not found'));
      assert.ok(textContent(container).includes('Return to companies'));
      assert.equal(window.location.pathname, '/companies/cmp_missing/overview');

      const returnLink = container.querySelector(
        'a[href="/companies"]',
      ) as HTMLAnchorElement | null;

      assert.ok(returnLink, 'Expected the return link');

      await act(async () => {
        returnLink.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
        await renderTick();
        await renderTick();
      });

      assert.equal(window.location.pathname, '/companies');
      assert.ok(textContent(container).includes('Companies'));

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    setFetch(async () =>
      createJsonResponse({
        data: [
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
      }),
    );

    try {
      const { container, root } = await renderApp('/dashboard');
      const companySwitcher = container.querySelector(
        '.sidebar-company-switcher',
      ) as HTMLButtonElement | null;

      assert.ok(companySwitcher, 'Expected the company switcher trigger');

      await act(async () => {
        companySwitcher.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
        await renderTick();
      });

      const summitButton = Array.from(
        document.querySelectorAll('.company-switcher-item-button'),
      ).find(button => button.textContent?.includes('Summit Health'));

      assert.ok(summitButton, 'Expected a company option');

      await act(async () => {
        summitButton.dispatchEvent(
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
        routes.companyWorkspaceOverview('cmp_3'),
      );

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }
  await assertRouteRenders(
    '/assessments',
    'All application security assessments across your workspace.',
  );
  await assertRouteRenders(
    '/threats',
    'Security findings across all active assessments.',
  );
  await assertRouteRenders('/reports', 'Report Preview');
  await assertRouteRenders(
    '/settings',
    'Manage your profile, workspace branding, and report defaults.',
  );

  {
    const { container, root } = await renderApp('/assessments/asm_1');

    assert.ok(textContent(container).includes('Customer Services Portal'));
    assert.ok(textContent(container).includes('NSD-CSP-2026-014'));
    assert.equal(window.location.pathname, '/assessments/asm_1');

    await act(async () => {
      root.unmount();
    });
  }

  {
    const { container, root } = await renderApp('/assessments/asm_missing');

    assert.ok(textContent(container).includes('Assessment not found'));
    assert.ok(textContent(container).includes('Return to assessments'));
    assert.equal(window.location.pathname, '/assessments/asm_missing');

    await act(async () => {
      root.unmount();
    });
  }

  {
    const { container, root } = await renderApp(
      routes.reportDetails(reportCover.reportId),
    );

    assert.ok(textContent(container).includes('Report Preview'));
    assert.ok(textContent(container).includes(reportCover.reportId));
    assert.equal(
      window.location.pathname,
      routes.reportDetails(reportCover.reportId),
    );

    await act(async () => {
      root.unmount();
    });
  }

  {
    const { container, root } = await renderApp('/reports/rpt_missing');

    assert.ok(textContent(container).includes('Report not found'));
    assert.ok(textContent(container).includes('Return to reports'));
    assert.equal(window.location.pathname, '/reports/rpt_missing');

    await act(async () => {
      root.unmount();
    });
  }

  {
    const { container, root } = await renderApp('/does-not-exist');

    assert.ok(textContent(container).includes('Requested page not found'));
    assert.ok(textContent(container).includes('Back to Dashboard'));

    await act(async () => {
      root.unmount();
    });
  }

  {
    setFetch(async () => createJsonResponse({ data: [] }));

    try {
      const { container, root } = await renderApp('/dashboard');
      const companySwitcher = container.querySelector(
        '.sidebar-company-switcher',
      ) as HTMLButtonElement | null;

      assert.ok(companySwitcher, 'Expected the company switcher trigger');

      await act(async () => {
        companySwitcher.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
        await renderTick();
      });

      const createCompanyButton = Array.from(
        document.querySelectorAll('.drawer-panel button'),
      ).find(button => button.textContent?.includes('Create company'));

      assert.ok(createCompanyButton, 'Expected the create company action');

      await act(async () => {
        createCompanyButton.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
        await renderTick();
        await renderTick();
      });

      assert.equal(window.location.pathname, '/companies');
      assert.ok(
        window.document.querySelector('input#company-name'),
        'Expected the create company drawer to open from the switcher',
      );

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    setFetch(async () =>
      createJsonResponse({
        data: [
          {
            id: 'cmp_3',
            name: 'Northwind Labs',
            website: 'https://northwind.example',
            contactEmail: 'security@northwind.example',
            assessmentCount: 2,
            createdAt: '2026-06-01T00:00:00.000Z',
            updatedAt: '2026-06-10T00:00:00.000Z',
          },
        ],
      }),
    );

    try {
      const { container, root } = await renderApp('/dashboard');
      const companySwitcher = container.querySelector(
        '.sidebar-company-switcher',
      ) as HTMLButtonElement | null;

      assert.ok(companySwitcher, 'Expected the company switcher trigger');

      await act(async () => {
        companySwitcher.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
        await renderTick();
      });

      const viewAllButton = Array.from(
        document.querySelectorAll('button'),
      ).find(button => button.textContent?.includes('View all'));

      assert.ok(viewAllButton, 'Expected a view all action');

      await act(async () => {
        viewAllButton.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
        await renderTick();
      });

      assert.equal(window.location.pathname, '/companies');
      assert.ok(textContent(document.body).includes('Companies'));

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    const { container, root } = await renderRouteErrorFixture('/broken');
    assert.ok(textContent(container).includes('Something went wrong'));
    assert.ok(textContent(container).includes('Back to Dashboard'));
    assert.ok(!textContent(container).includes('Error:'));
    assert.ok(!textContent(container).includes('stack'));

    const dashboardLink = container.querySelector('a[href="/dashboard"]');

    assert.ok(dashboardLink, 'Expected a dashboard recovery link');

    await act(async () => {
      dashboardLink.dispatchEvent(
        new window.MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          button: 0,
        }),
      );
      await renderTick();
      await renderTick();
    });

    assert.equal(window.location.pathname, '/dashboard');
    assert.ok(textContent(container).includes('Security Dashboard'));

    await act(async () => {
      root.unmount();
    });
  }

  console.log('router checks passed');
})();

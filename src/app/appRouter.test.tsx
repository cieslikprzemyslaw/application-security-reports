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

const setupDom = (
  pathname: string,
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

  return {
    container: window.document.getElementById('root'),
  };
};

const renderApp = async (
  pathname: string,
  settle = true,
  localStorageEntries?: Record<string, string>,
) => {
  const { container } = setupDom(pathname, localStorageEntries);

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
  await assert.doesNotReject(async () => import('./appData'));

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
    setFetch(async input => {
      const path = String(input);

      if (path === '/api/companies') {
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
      }

      if (path === '/api/companies/cmp_2/overview') {
        return createJsonResponse({
          data: {
            company: {
              id: 'cmp_2',
              name: 'Meridian Finance',
              description: 'Financial services workspace',
              website: 'https://meridian.example',
              contactName: 'B. Example',
              contactEmail: 'security@meridian.example',
              logoPath: '/logos/meridian.svg',
              footerText: 'Confidential',
              createdAt: '2026-06-02T00:00:00.000Z',
              updatedAt: '2026-06-11T00:00:00.000Z',
            },
            assessmentCounts: {
              total: 1,
              draft: 0,
              inProgress: 1,
              completed: 0,
            },
            recentAssessments: [],
          },
        });
      }

      throw new Error(`Unexpected request: ${path}`);
    });

    try {
      const { container, root } = await renderApp('/');

      assert.equal(window.location.pathname, '/dashboard');
      assert.ok(textContent(container).includes('Recent companies'));

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
      const { container, root } = await renderApp('/dashboard', true, {
        'appsec-company-switcher-recents': JSON.stringify(['cmp_2', 'cmp_1']),
        'appsec-company-switcher-recent-open-times': JSON.stringify({
          cmp_2: '2026-06-14T16:45:00.000Z',
          cmp_1: '2026-06-15T08:15:00.000Z',
        }),
      });

      const companyTitles = Array.from(
        container.querySelectorAll('.card-title'),
      ).map(node => node.textContent);

      assert.deepEqual(companyTitles.slice(0, 3), [
        'Meridian Finance',
        'Northwind Labs',
        'Summit Health',
      ]);
      assert.ok(textContent(container).includes('Last opened'));

      const openCompanyButton = Array.from(
        container.querySelectorAll('button'),
      ).find(button => button.textContent?.includes('Open company')) as
        | HTMLButtonElement
        | undefined;

      assert.ok(openCompanyButton, 'Expected an open company action');

      await act(async () => {
        openCompanyButton.dispatchEvent(
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
    setFetch(async () => createJsonResponse({ data: [] }));

    try {
      const { container, root } = await renderApp('/dashboard');

      assert.ok(textContent(container).includes('Recent companies'));
      assert.ok(textContent(container).includes('No companies yet'));
      assert.ok(textContent(container).includes('Create company'));

      const createCompanyButton = container.querySelector(
        '.dashboard-empty-card button',
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
        'Expected the create company drawer to open from the dashboard',
      );

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    let requestCount = 0;

    setFetch(async () => {
      requestCount += 1;

      if (requestCount === 1) {
        throw new Error('Unable to load companies.');
      }

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
      const { container, root } = await renderApp('/dashboard');

      assert.ok(
        textContent(container).includes('Unable to load recent companies'),
      );
      assert.ok(textContent(container).includes('Retry'));

      const retryButton = Array.from(container.querySelectorAll('button')).find(
        button => button.textContent?.includes('Retry'),
      ) as HTMLButtonElement | undefined;

      assert.ok(retryButton, 'Expected a retry action');

      await act(async () => {
        retryButton.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
        await renderTick();
        await renderTick();
      });

      assert.ok(textContent(container).includes('Northwind Labs'));

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

      if (String(input) === '/api/companies/cmp_2/overview') {
        return createJsonResponse({
          data: {
            company: {
              id: 'cmp_2',
              name: 'Northwind Labs',
              description: 'Cloud security partner',
              website: 'https://northwind.example',
              contactName: 'A. Example',
              contactEmail: 'security@northwind.example',
              logoPath: '/logos/northwind.svg',
              footerText: 'Confidential',
              createdAt: '2026-06-01T00:00:00.000Z',
              updatedAt: '2026-06-10T00:00:00.000Z',
            },
            assessmentCounts: {
              total: 1,
              draft: 0,
              inProgress: 1,
              completed: 0,
            },
            recentAssessments: [],
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

      const createButton = container.querySelector(
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
      const path = String(input);

      if (path === '/api/companies') {
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
      }

      if (path === '/api/companies/cmp_1/overview') {
        return createJsonResponse({
          data: {
            company: {
              id: 'cmp_1',
              name: 'Northwind Labs',
              description: 'Cloud security partner',
              website: 'https://northwind.example',
              contactName: 'A. Example',
              contactEmail: 'security@northwind.example',
              logoPath: '/logos/northwind.svg',
              footerText: 'Confidential',
              createdAt: '2026-06-01T00:00:00.000Z',
              updatedAt: '2026-06-10T00:00:00.000Z',
            },
            assessmentCounts: {
              total: 2,
              draft: 1,
              inProgress: 1,
              completed: 0,
            },
            recentAssessments: [
              {
                id: 'asm_1',
                applicationName: 'Customer Services Portal',
                companyName: 'Northwind Labs',
                assessmentType: 'Web App',
                severity: 'high',
                findingsCount: 7,
                status: 'in-progress',
              },
            ],
          },
        });
      }

      if (path.startsWith('/api/assessments')) {
        return createJsonResponse({
          data: [
            {
              id: 'asm_1',
              name: 'Customer Services Portal',
              type: 'Web App',
              status: 'in-progress',
              findingsCount: 7,
              updatedAt: '2026-06-14T10:15:00.000Z',
              description: 'Assessment of the customer portal',
              scope: 'Web application',
            },
          ],
        });
      }

      throw new Error(`Unexpected request: ${path}`);
    });

    try {
      const { container, root } = await renderApp(
        routes.companyWorkspaceOverview('cmp_1'),
      );

      assert.ok(textContent(container).includes('Northwind Labs'));
      assert.ok(textContent(container).includes('Quick actions'));
      assert.ok(textContent(container).includes('Recent assessments'));
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
      assert.ok(!textContent(container).includes('Recent reports'));

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    setFetch(async input => {
      const path = String(input);

      if (path === '/api/companies') {
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
      }

      if (path === '/api/companies/cmp_1/overview') {
        return createJsonResponse({
          data: {
            company: {
              id: 'cmp_1',
              name: 'Northwind Labs',
              description: 'Cloud security partner',
              website: 'https://northwind.example',
              contactName: 'A. Example',
              contactEmail: 'security@northwind.example',
              logoPath: '/logos/northwind.svg',
              footerText: 'Confidential',
              createdAt: '2026-06-01T00:00:00.000Z',
              updatedAt: '2026-06-10T00:00:00.000Z',
            },
            assessmentCounts: {
              total: 2,
              draft: 1,
              inProgress: 1,
              completed: 0,
            },
            recentAssessments: [],
          },
        });
      }

      if (path.startsWith('/api/assessments')) {
        return createJsonResponse({
          data: [
            {
              id: 'asm_1',
              name: 'Customer Services Portal',
              type: 'Web App',
              status: 'in-progress',
              findingsCount: 7,
              updatedAt: '2026-06-14T10:15:00.000Z',
              description: 'Assessment of the customer portal',
              scope: 'Web application',
            },
          ],
        });
      }

      throw new Error(`Unexpected request: ${path}`);
    });

    try {
      const { container, root } = await renderApp(
        routes.companyWorkspaceAssessments('cmp_1'),
      );

      assert.ok(textContent(container).includes('Assessments'));
      assert.ok(textContent(container).includes('Customer Services Portal'));
      assert.ok(textContent(container).includes('Findings'));

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    setFetch(async input => {
      const path = String(input);

      if (path === '/api/companies') {
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
      }

      if (path === '/api/companies/cmp_1/overview') {
        return createJsonResponse({
          data: {
            company: {
              id: 'cmp_1',
              name: 'Northwind Labs',
              description: 'Cloud security partner',
              website: 'https://northwind.example',
              contactName: 'A. Example',
              contactEmail: 'security@northwind.example',
              logoPath: '/logos/northwind.svg',
              footerText: 'Confidential',
              createdAt: '2026-06-01T00:00:00.000Z',
              updatedAt: '2026-06-10T00:00:00.000Z',
            },
            assessmentCounts: {
              total: 2,
              draft: 1,
              inProgress: 1,
              completed: 0,
            },
            recentAssessments: [],
          },
        });
      }

      throw new Error(`Unexpected request: ${path}`);
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
      const path = String(input);

      if (path === '/api/companies') {
        return createJsonResponse({
          data: [
            {
              id: 'cmp_1',
              name: 'Northwind Labs',
              website: 'https://northwind.example',
              contactEmail: 'security@northwind.example',
              assessmentCount: 0,
              createdAt: '2026-06-01T00:00:00.000Z',
              updatedAt: '2026-06-10T00:00:00.000Z',
            },
          ],
        });
      }

      if (path === '/api/companies/cmp_1/overview') {
        return createJsonResponse({
          data: {
            company: {
              id: 'cmp_1',
              name: 'Northwind Labs',
              description: 'Cloud security partner',
              website: 'https://northwind.example',
              contactName: 'A. Example',
              contactEmail: 'security@northwind.example',
              logoPath: '/logos/northwind.svg',
              footerText: 'Confidential',
              createdAt: '2026-06-01T00:00:00.000Z',
              updatedAt: '2026-06-10T00:00:00.000Z',
            },
            assessmentCounts: {
              total: 0,
              draft: 0,
              inProgress: 0,
              completed: 0,
            },
            recentAssessments: [],
            recentReports: null,
          },
        });
      }

      throw new Error(`Unexpected request: ${path}`);
    });

    try {
      const { container, root } = await renderApp(
        routes.companyWorkspaceOverview('cmp_1'),
      );

      assert.ok(textContent(container).includes('No assessments yet'));
      assert.ok(textContent(container).includes('Edit company'));
      assert.ok(!textContent(container).includes('Recent reports'));

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
      const path = String(input);

      if (path === '/api/companies') {
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
      }

      if (path === '/api/companies/cmp_1/overview') {
        return createJsonResponse({
          data: {
            company: {
              id: 'cmp_1',
              name: 'Northwind Labs',
              description: 'Cloud security partner',
              website: 'https://northwind.example',
              contactName: 'A. Example',
              contactEmail: 'security@northwind.example',
              logoPath: '/logos/northwind.svg',
              footerText: 'Confidential',
              createdAt: '2026-06-01T00:00:00.000Z',
              updatedAt: '2026-06-10T00:00:00.000Z',
            },
            assessmentCounts: {
              total: 2,
              draft: 1,
              inProgress: 1,
              completed: 0,
            },
            recentAssessments: [],
          },
        });
      }

      throw new Error(`Unexpected request: ${path}`);
    });

    try {
      const { container, root } = await renderApp('/companies/cmp_1');

      assert.equal(
        window.location.pathname,
        routes.companyWorkspaceOverview('cmp_1'),
      );
      assert.ok(textContent(container).includes('Northwind Labs'));

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
    setFetch(async input => {
      const path = String(input);

      if (path === '/api/companies') {
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
      }

      if (path === '/api/companies/cmp_3/overview') {
        return createJsonResponse({
          data: {
            company: {
              id: 'cmp_3',
              name: 'Summit Health',
              description: 'Healthcare security workspace',
              website: 'https://summit.example',
              contactName: 'C. Example',
              contactEmail: 'security@summit.example',
              logoPath: '/logos/summit.svg',
              footerText: 'Confidential',
              createdAt: '2026-06-03T00:00:00.000Z',
              updatedAt: '2026-06-12T00:00:00.000Z',
            },
            assessmentCounts: {
              total: 3,
              draft: 1,
              inProgress: 1,
              completed: 1,
            },
            recentAssessments: [],
          },
        });
      }

      throw new Error(`Unexpected request: ${path}`);
    });

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
  {
    setFetch(async input => {
      assert.equal(String(input), '/api/companies');
      return createJsonResponse({ data: [] });
    });

    try {
      const { container, root } = await renderApp('/assessments');

      assert.equal(window.location.pathname, '/dashboard');
      assert.ok(textContent(container).includes('No companies yet'));

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }
  await assertRouteRenders(
    '/threats',
    'Security findings across all active assessments.',
  );
  await assertRouteRenders('/reports', 'Report Preview');
  {
    const { container, root } = await renderApp('/settings');

    assert.ok(
      textContent(container).includes(
        'Manage organisation details, report branding, defaults, and user preferences.',
      ),
    );
    assert.ok(
      !textContent(container).includes('Something went wrong'),
      'Expected the settings route to avoid the route error boundary',
    );
    assert.ok(container.querySelector('.settings-form'));

    await act(async () => {
      root.unmount();
    });
  }

  setFetch(async input => {
    const path = String(input);

    if (path === '/api/companies') {
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
    }

    if (path === '/api/companies/cmp_1/assessments') {
      return createJsonResponse({
        data: [
          {
            id: 'asm_1',
            name: 'Customer Services Portal',
            type: 'Web App',
            status: 'in-progress',
            findingsCount: 14,
            updatedAt: '2026-06-15T09:00:00.000Z',
            description: 'Assessment of the customer portal',
            scope: 'Web application',
          },
          {
            id: 'asm_5',
            name: 'Data Export Service',
            type: 'API',
            status: 'archived',
            findingsCount: 3,
            updatedAt: '2026-06-12T09:00:00.000Z',
            description: 'Archived export service review',
            scope: 'Backend API',
          },
        ],
      });
    }

    if (path === '/api/companies/cmp_1/assessments/asm_1/overview') {
      return createJsonResponse({
        data: {
          company: {
            id: 'cmp_1',
            name: 'Northwind Labs',
          },
          assessment: {
            id: 'asm_1',
            companyId: 'cmp_1',
            title: 'Customer Services Portal',
            description: 'Assessment of the customer portal',
            scope: 'Web application',
            status: 'in-progress',
            startedAt: '2026-06-01',
            completedAt: '2026-06-10',
            applicationName: 'Customer Services Portal',
            environment: 'Production',
            assessmentType: 'Web App',
            overallRisk: 'high',
            createdAt: '2026-06-01T09:00:00.000Z',
            updatedAt: '2026-06-11T09:00:00.000Z',
            recordVersion: 3,
            findingsCount: 14,
            evidenceCount: 6,
            reportVersionCount: 2,
            testerName: 'Alex Mercer',
            availableActions: ['complete', 'archive'],
          },
        },
      });
    }

    if (path.startsWith('/api/evidence')) {
      if (path.includes('assessmentId=asm_1')) {
        return createJsonResponse({
          data: [
            {
              id: 'evd_1',
              assessmentId: 'asm_1',
              threatIds: ['thr_1'],
              type: 'http',
              title: 'Evidence screenshot',
              description: 'Captured evidence for the assessment',
              content: 'Plain-text evidence',
              fileName: 'evidence.png',
              filePath: 'uploads/evidence/evd_1/attachment.png',
              storageKey: 'uploads/evidence/evd_1/attachment.png',
              mimeType: 'image/png',
              attachmentSizeBytes: 1234,
              capturedAt: '2026-06-05',
              httpExchanges: [
                {
                  request: {
                    method: 'GET',
                    url: '/api/orders/1',
                    body: 'request body',
                  },
                  response: {
                    statusCode: 200,
                    statusText: 'OK',
                    body: 'response body',
                  },
                },
              ],
              createdAt: '2026-06-05T00:00:00.000Z',
              updatedAt: '2026-06-05T00:00:00.000Z',
            },
          ],
        });
      }

      if (path.includes('assessmentId=asm_5')) {
        return createJsonResponse({ data: [] });
      }
    }

    if (path === '/api/companies/cmp_1/assessments/asm_5/overview') {
      return createJsonResponse({
        data: {
          company: {
            id: 'cmp_1',
            name: 'Northwind Labs',
          },
          assessment: {
            id: 'asm_5',
            companyId: 'cmp_1',
            title: 'Data Export Service',
            status: 'archived',
            applicationName: 'Data Export Service',
            environment: 'Production',
            assessmentType: 'API',
            overallRisk: 'low',
            createdAt: '2026-05-16T09:00:00.000Z',
            updatedAt: '2026-05-24T09:00:00.000Z',
            recordVersion: 1,
            findingsCount: 3,
            evidenceCount: 0,
            reportVersionCount: 0,
            testerName: 'Jordan Lee',
            availableActions: ['reopen'],
          },
        },
      });
    }

    if (path === '/api/companies/cmp_1/assessments/asm_missing/overview') {
      return createJsonResponse(
        {
          error: {
            code: 'ASSESSMENT_NOT_FOUND',
            message: 'Assessment not found',
            details: [],
          },
        },
        { status: 404 },
      );
    }

    if (path === '/api/companies/cmp_1/assessments/asm_1/commands/complete') {
      return createJsonResponse(
        {
          error: {
            code: 'RESOURCE_MODIFIED',
            message: 'The assessment was modified by another session.',
            details: [],
          },
        },
        { status: 409 },
      );
    }

    throw new Error(`Unexpected request: ${path}`);
  });

  try {
    {
      const { container, root } = await renderApp(
        routes.companyWorkspaceAssessments('cmp_1'),
      );

      assert.ok(textContent(container).includes('Customer Services Portal'));
      assert.ok(textContent(container).includes('Data Export Service'));

      const editableRow = Array.from(
        container.querySelectorAll('.assessment-table__row'),
      ).find(row => row.textContent?.includes('Customer Services Portal')) as
        | HTMLTableRowElement
        | undefined;

      assert.ok(editableRow, 'Expected an editable assessment row');
      assert.equal(editableRow?.tabIndex, 0);

      await act(async () => {
        editableRow!.focus();
        assert.equal(window.document.activeElement, editableRow);
        editableRow!.dispatchEvent(
          new window.KeyboardEvent('keydown', {
            bubbles: true,
            cancelable: true,
            key: 'Enter',
          }),
        );
        await renderTick();
        await renderTick();
      });

      assert.equal(
        window.location.pathname,
        routes.assessmentDetailsOverview('cmp_1', 'asm_1'),
      );
      assert.equal(
        container.querySelector('[role="tab"][aria-selected="true"]')
          ?.textContent,
        'Overview',
      );

      const findingsTab = Array.from(
        container.querySelectorAll('[role="tab"]'),
      ).find(button => button.textContent?.startsWith('Findings')) as
        | HTMLButtonElement
        | undefined;

      assert.ok(findingsTab, 'Expected the Findings tab');

      await act(async () => {
        findingsTab!.dispatchEvent(
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
        routes.assessmentDetailsFindings('cmp_1', 'asm_1'),
      );
      assert.ok(textContent(container).includes('Add finding'));

      await act(async () => {
        root.unmount();
      });
    }

    {
      const { container, root } = await renderApp(
        routes.companyWorkspaceAssessments('cmp_1'),
      );

      const archivedRow = Array.from(
        container.querySelectorAll('.assessment-table__row'),
      ).find(row => row.textContent?.includes('Data Export Service')) as
        | HTMLTableRowElement
        | undefined;

      assert.ok(archivedRow, 'Expected an archived assessment row');

      await act(async () => {
        archivedRow!.dispatchEvent(
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
        routes.assessmentDetailsOverview('cmp_1', 'asm_5'),
      );
      assert.ok(textContent(container).includes('read-only'));

      const findingsTab = Array.from(
        container.querySelectorAll('[role="tab"]'),
      ).find(button => button.textContent?.startsWith('Findings')) as
        | HTMLButtonElement
        | undefined;

      assert.ok(
        findingsTab,
        'Expected the Findings tab for the archived assessment',
      );

      await act(async () => {
        findingsTab!.dispatchEvent(
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
        routes.assessmentDetailsFindings('cmp_1', 'asm_5'),
      );
      assert.ok(
        !textContent(container).includes('Add finding'),
        'Expected archived assessments to hide the create action',
      );

      await act(async () => {
        root.unmount();
      });
    }

    {
      const { container, root } = await renderApp(
        routes.assessmentDetailsOverview('cmp_1', 'asm_1'),
      );

      assert.ok(textContent(container).includes('Customer Services Portal'));
      assert.ok(textContent(container).includes('NSD-CSP-2026-014'));
      assert.equal(
        container.querySelector('[role="tablist"]')?.getAttribute('aria-label'),
        'Assessment sections',
      );
      assert.equal(
        window.location.pathname,
        routes.assessmentDetailsOverview('cmp_1', 'asm_1'),
      );
      assert.equal(
        container.querySelector('[role="tab"][aria-selected="true"]')
          ?.textContent,
        'Overview',
      );

      await act(async () => {
        root.unmount();
      });
    }

    {
      const { container, root } = await renderApp(
        routes.assessmentDetailsOverview('cmp_1', 'asm_1'),
      );

      const completeButton = Array.from(
        container.querySelectorAll('button'),
      ).find(button => button.textContent?.includes('Complete')) as
        | HTMLButtonElement
        | undefined;

      assert.ok(completeButton, 'Expected a complete action');

      await act(async () => {
        completeButton!.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
        await renderTick();
        await renderTick();
      });

      assert.ok(
        textContent(container).includes('Assessment changed elsewhere'),
      );

      await act(async () => {
        root.unmount();
      });
    }

    {
      const { container, root } = await renderApp(
        routes.assessmentDetails('cmp_1', 'asm_1'),
      );

      assert.ok(textContent(container).includes('Customer Services Portal'));
      assert.equal(
        window.location.pathname,
        routes.assessmentDetails('cmp_1', 'asm_1'),
      );
      assert.equal(
        container.querySelector('[role="tab"][aria-selected="true"]')
          ?.textContent,
        'Overview',
      );

      await act(async () => {
        root.unmount();
      });
    }

    {
      const { container, root } = await renderApp(
        routes.assessmentDetailsFindings('cmp_1', 'asm_1'),
      );

      assert.ok(textContent(container).includes('Findings14'));
      assert.equal(
        window.location.pathname,
        routes.assessmentDetailsFindings('cmp_1', 'asm_1'),
      );
      assert.equal(
        container.querySelector(
          'a[href="/companies/cmp_1/assessments/asm_1/overview"]',
        )?.textContent,
        'Customer Services Portal',
      );
      assert.equal(
        container.querySelector('[role="tab"][aria-selected="true"]')
          ?.textContent,
        'Findings14',
      );

      const activeTab = container.querySelector(
        '[role="tab"][aria-selected="true"]',
      ) as HTMLButtonElement | null;

      assert.ok(activeTab, 'Expected an active tab');
      assert.ok(activeTab?.textContent?.startsWith('Findings'));

      await act(async () => {
        activeTab!.dispatchEvent(
          new window.KeyboardEvent('keydown', {
            bubbles: true,
            cancelable: true,
            key: 'ArrowRight',
          }),
        );
        await renderTick();
        await renderTick();
      });

      assert.equal(
        window.location.pathname,
        routes.assessmentDetailsEvidence('cmp_1', 'asm_1'),
      );
      assert.ok(textContent(container).includes('Add evidence'));
      assert.ok(textContent(container).includes('Evidence screenshot'));

      await act(async () => {
        root.unmount();
      });
    }

    {
      const { container, root } = await renderApp(
        routes.assessmentDetailsHistory('cmp_1', 'asm_5'),
      );

      assert.ok(textContent(container).includes('read-only'));
      assert.ok(textContent(container).includes('Archived'));
      assert.ok(
        !Array.from(container.querySelectorAll('button')).some(button =>
          button.textContent?.includes('Edit assessment'),
        ),
      );

      await act(async () => {
        root.unmount();
      });
    }

    {
      const { container, root } = await renderApp(
        routes.assessmentDetailsReports('cmp_1', 'asm_1'),
      );

      assert.ok(textContent(container).includes('Assessment report details'));
      assert.equal(
        window.location.pathname,
        routes.assessmentDetailsReports('cmp_1', 'asm_1'),
      );
      assert.equal(
        container.querySelector('[role="tab"][aria-selected="true"]')
          ?.textContent,
        'Reports2',
      );

      await act(async () => {
        root.unmount();
      });
    }

    {
      const { container, root } = await renderApp(
        '/companies/cmp_1/assessments/asm_missing',
      );

      assert.ok(textContent(container).includes('Assessment not found'));
      assert.ok(textContent(container).includes('Return to assessments'));
      assert.equal(
        window.location.pathname,
        '/companies/cmp_1/assessments/asm_missing',
      );

      await act(async () => {
        root.unmount();
      });
    }
  } finally {
    restoreFetch();
  }

  {
    const { reportCover } = await import('./appData');

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
    assert.ok(textContent(container).includes('Recent companies'));

    await act(async () => {
      root.unmount();
    });
  }

  console.log('router checks passed');
})();

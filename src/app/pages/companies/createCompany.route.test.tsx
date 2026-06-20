import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';

import AppRouter from '~/app/appRouter';
import { routes } from '~/routes';
import { AppThemeProvider, defaultTheme } from '~/theme';

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

const createErrorResponse = (
  status: number,
  message: string,
  code = 'REQUEST_FAILED',
) =>
  createJsonResponse(
    {
      error: {
        code,
        message,
        details: [],
      },
    },
    { status },
  );

const setGlobal = <K extends PropertyKey>(key: K, value: unknown) => {
  Object.defineProperty(globalThis, key, {
    value,
    configurable: true,
    writable: true,
  });
};

const getRequestDetails = (input: RequestInfo | URL, init?: RequestInit) => {
  const rawTarget =
    input instanceof URL
      ? input.toString()
      : input instanceof Request
        ? input.url
        : String(input);

  return {
    method: init?.method ?? (input instanceof Request ? input.method : 'GET'),
    path: new URL(rawTarget, 'http://localhost').pathname,
  };
};

type TestWindow = Window &
  typeof globalThis & {
    confirm: (message?: string) => boolean;
  };

const setupDom = (pathname: string) => {
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="root"></div></body></html>',
    { url: `http://localhost${pathname}` },
  );
  const { window } = dom;

  window.URL.createObjectURL = () => 'blob:mock-company-logo';
  window.URL.revokeObjectURL = () => undefined;

  setGlobal('window', window);
  setGlobal('document', window.document);
  setGlobal('navigator', window.navigator);
  setGlobal('HTMLElement', window.HTMLElement);
  setGlobal('Node', window.Node);
  setGlobal('URL', window.URL);
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

  Object.defineProperty(window.HTMLElement.prototype, 'attachEvent', {
    value: () => undefined,
    configurable: true,
  });
  Object.defineProperty(window.HTMLElement.prototype, 'detachEvent', {
    value: () => undefined,
    configurable: true,
  });

  const container = window.document.getElementById('root');
  assert.ok(container, 'Expected the root test container');

  return {
    container,
    window: window as unknown as TestWindow,
  };
};

const renderApp = async (pathname: string) => {
  const { container, window } = setupDom(pathname);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      <AppThemeProvider>
        <ThemeProvider theme={defaultTheme}>
          <AppRouter />
        </ThemeProvider>
      </AppThemeProvider>,
    );

    await renderTick();
    await renderTick();
  });

  return { container, root, window };
};

const findButtonByText = (container: ParentNode, text: string) =>
  Array.from(container.querySelectorAll<HTMLButtonElement>('button')).find(
    button => button.textContent?.includes(text),
  );

const fillCompanyName = async (window: TestWindow, name: string) => {
  const input = window.document.querySelector(
    '#company-name',
  ) as HTMLInputElement | null;

  assert.ok(input, 'Expected the company name input');

  await act(async () => {
    input.value = name;
    input.dispatchEvent(
      new window.Event('input', {
        bubbles: true,
        cancelable: true,
      }),
    );
    await renderTick();
  });
};

const selectLogoFile = async (
  window: TestWindow,
  file: File,
  selector = '#company-logo',
) => {
  const input = window.document.querySelector(
    selector,
  ) as HTMLInputElement | null;

  assert.ok(input, `Expected the file input ${selector}`);

  await act(async () => {
    Object.defineProperty(input, 'files', {
      value: { 0: file, length: 1, item: () => file },
      configurable: true,
    });
    input.dispatchEvent(
      new window.Event('change', {
        bubbles: true,
        cancelable: true,
      }),
    );
    await renderTick();
  });
};

const clickButton = async (window: TestWindow, button: HTMLButtonElement) => {
  await act(async () => {
    button.dispatchEvent(
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
};

const createLogoFile = (window: TestWindow, name = 'logo.png') =>
  new window.File(['fake-png'], name, { type: 'image/png' });

await (async () => {
  {
    const requestLog: string[] = [];
    const companyId = 'cmp_00000000-0000-0000-0000-000000000010';

    setFetch(async (input, init) => {
      const request = getRequestDetails(input, init);
      requestLog.push(`${request.method} ${request.path}`);

      if (request.method === 'GET' && request.path === '/api/companies') {
        return createJsonResponse({ data: [] });
      }

      if (request.method === 'POST' && request.path === '/api/companies') {
        return createJsonResponse({
          data: {
            id: companyId,
            name: 'Northwind Labs',
            description: 'Cloud security partner',
            website: 'https://northwind.example',
            contactName: 'A. Example',
            contactEmail: 'security@northwind.example',
            logoUrl: null,
            footerText: 'Confidential',
            createdAt: '2026-06-01T00:00:00.000Z',
            updatedAt: '2026-06-10T00:00:00.000Z',
          },
        });
      }

      if (
        request.method === 'PUT' &&
        request.path === `/api/companies/${companyId}/logo`
      ) {
        return createJsonResponse({
          data: {
            id: companyId,
            name: 'Northwind Labs',
            description: 'Cloud security partner',
            website: 'https://northwind.example',
            contactName: 'A. Example',
            contactEmail: 'security@northwind.example',
            logoUrl: `http://localhost/api/companies/${companyId}/logo`,
            footerText: 'Confidential',
            createdAt: '2026-06-01T00:00:00.000Z',
            updatedAt: '2026-06-10T00:00:00.000Z',
          },
        });
      }

      if (
        request.method === 'GET' &&
        request.path === `/api/companies/${companyId}/overview`
      ) {
        return createJsonResponse({
          data: {
            company: {
              id: companyId,
              name: 'Northwind Labs',
              description: 'Cloud security partner',
              website: 'https://northwind.example',
              contactName: 'A. Example',
              contactEmail: 'security@northwind.example',
              logoUrl: `http://localhost/api/companies/${companyId}/logo`,
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
          },
        });
      }
      throw new Error(`Unexpected request: ${request.method} ${request.path}`);
    });

    try {
      const { container, root, window } = await renderApp('/companies/new');

      await fillCompanyName(window, 'Northwind Labs');
      await selectLogoFile(window, createLogoFile(window));

      const submitButton = container.querySelector(
        'button[type="submit"]',
      ) as HTMLButtonElement | null;

      assert.ok(submitButton, 'Expected the create company submit button');

      await clickButton(window, submitButton);

      assert.equal(
        window.location.pathname,
        routes.companyWorkspaceOverview(companyId),
      );
      assert.equal(
        requestLog.filter(entry => entry === 'POST /api/companies').length,
        1,
      );
      assert.equal(
        requestLog.filter(
          entry => entry === `PUT /api/companies/${companyId}/logo`,
        ).length,
        1,
      );
      assert.ok(
        container.textContent?.includes('Northwind Labs'),
        'Expected the first company workspace to open after logo upload',
      );

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    const requestLog: string[] = [];
    const companyId = 'cmp_00000000-0000-0000-0000-000000000020';
    let logoUploadAttempts = 0;

    let companyCreated = false;

    setFetch(async (input, init) => {
      const request = getRequestDetails(input, init);
      requestLog.push(`${request.method} ${request.path}`);

      if (request.method === 'GET' && request.path === '/api/companies') {
        return createJsonResponse({
          data: [
            {
              id: 'cmp_00000000-0000-0000-0000-000000000001',
              name: 'Existing Company',
              website: 'https://existing.example',
              contactEmail: 'security@existing.example',
              assessmentCount: 1,
              createdAt: '2026-06-01T00:00:00.000Z',
              updatedAt: '2026-06-10T00:00:00.000Z',
            },
            ...(companyCreated
              ? [
                  {
                    id: companyId,
                    name: 'Northwind Labs',
                    website: 'https://northwind.example',
                    contactEmail: 'security@northwind.example',
                    assessmentCount: 0,
                    createdAt: '2026-06-01T00:00:00.000Z',
                    updatedAt: '2026-06-10T00:00:00.000Z',
                  },
                ]
              : []),
          ],
        });
      }

      if (request.method === 'POST' && request.path === '/api/companies') {
        companyCreated = true;
        return createJsonResponse({
          data: {
            id: companyId,
            name: 'Northwind Labs',
            description: 'Cloud security partner',
            website: 'https://northwind.example',
            contactName: 'A. Example',
            contactEmail: 'security@northwind.example',
            logoUrl: null,
            footerText: 'Confidential',
            createdAt: '2026-06-01T00:00:00.000Z',
            updatedAt: '2026-06-10T00:00:00.000Z',
          },
        });
      }

      if (
        request.method === 'PUT' &&
        request.path === `/api/companies/${companyId}/logo`
      ) {
        logoUploadAttempts += 1;

        if (logoUploadAttempts === 1) {
          return createErrorResponse(500, 'Logo storage unavailable');
        }

        return createJsonResponse({
          data: {
            id: companyId,
            name: 'Northwind Labs',
            description: 'Cloud security partner',
            website: 'https://northwind.example',
            contactName: 'A. Example',
            contactEmail: 'security@northwind.example',
            logoUrl: `http://localhost/api/companies/${companyId}/logo`,
            footerText: 'Confidential',
            createdAt: '2026-06-01T00:00:00.000Z',
            updatedAt: '2026-06-10T00:00:00.000Z',
          },
        });
      }

      throw new Error(`Unexpected request: ${request.method} ${request.path}`);
    });

    try {
      const { container, root, window } = await renderApp('/companies/new');

      await fillCompanyName(window, 'Northwind Labs');
      await selectLogoFile(window, createLogoFile(window));

      const submitButton = container.querySelector(
        'button[type="submit"]',
      ) as HTMLButtonElement | null;

      assert.ok(submitButton, 'Expected the create company submit button');

      await clickButton(window, submitButton);

      assert.equal(window.location.pathname, '/companies/new');
      assert.ok(
        container.textContent?.includes(
          'Company created. Logo upload still pending.',
        ),
        'Expected the partial-success callout',
      );
      assert.ok(
        container.textContent?.includes('Logo storage unavailable'),
        'Expected the upload failure message to stay visible',
      );
      assert.equal(
        requestLog.filter(entry => entry === 'POST /api/companies').length,
        1,
      );
      assert.equal(
        requestLog.filter(
          entry => entry === `PUT /api/companies/${companyId}/logo`,
        ).length,
        1,
      );

      const retryButton = findButtonByText(container, 'Retry logo upload');
      assert.ok(retryButton, 'Expected the retry upload action');

      await clickButton(window, retryButton);

      assert.equal(window.location.pathname, routes.companies);
      assert.equal(
        requestLog.filter(entry => entry === 'POST /api/companies').length,
        1,
      );
      assert.equal(
        requestLog.filter(
          entry => entry === `PUT /api/companies/${companyId}/logo`,
        ).length,
        2,
      );
      assert.ok(
        container.textContent?.includes('Companies'),
        'Expected the companies list after retry succeeds',
      );

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    const requestLog: string[] = [];

    setFetch(async (input, init) => {
      const request = getRequestDetails(input, init);
      requestLog.push(`${request.method} ${request.path}`);

      if (request.method === 'GET' && request.path === '/api/companies') {
        return createJsonResponse({ data: [] });
      }

      if (request.method === 'POST' && request.path === '/api/companies') {
        return createErrorResponse(500, 'Unable to save company.');
      }

      throw new Error(`Unexpected request: ${request.method} ${request.path}`);
    });

    try {
      const { container, root, window } = await renderApp('/companies/new');

      await fillCompanyName(window, 'Northwind Labs');
      await selectLogoFile(window, createLogoFile(window));

      const submitButton = container.querySelector(
        'button[type="submit"]',
      ) as HTMLButtonElement | null;

      assert.ok(submitButton, 'Expected the create company submit button');

      await clickButton(window, submitButton);

      assert.equal(window.location.pathname, '/companies/new');
      assert.ok(
        container.textContent?.includes('Unable to save company.'),
        'Expected the company create error message',
      );
      assert.equal(
        requestLog.filter(entry => entry === 'POST /api/companies').length,
        1,
      );
      assert.equal(
        requestLog.filter(entry => entry.includes('/logo')).length,
        0,
      );

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    const companyId = 'cmp_00000000-0000-0000-0000-000000000030';

    let testWindow: TestWindow | undefined;

    setFetch(async (input, init) => {
      const request = getRequestDetails(input, init);

      if (request.method === 'GET' && request.path === '/api/companies') {
        return createJsonResponse({
          data: [
            {
              id: 'cmp_00000000-0000-0000-0000-000000000001',
              name: 'Existing Company',
              website: 'https://existing.example',
              contactEmail: 'security@existing.example',
              assessmentCount: 1,
              createdAt: '2026-06-01T00:00:00.000Z',
              updatedAt: '2026-06-10T00:00:00.000Z',
            },
          ],
        });
      }

      if (request.method === 'POST' && request.path === '/api/companies') {
        return createJsonResponse({
          data: {
            id: companyId,
            name: 'Northwind Labs',
            description: 'Cloud security partner',
            website: 'https://northwind.example',
            contactName: 'A. Example',
            contactEmail: 'security@northwind.example',
            logoUrl: null,
            footerText: 'Confidential',
            createdAt: '2026-06-01T00:00:00.000Z',
            updatedAt: '2026-06-10T00:00:00.000Z',
          },
        });
      }

      if (
        request.method === 'PUT' &&
        request.path === `/api/companies/${companyId}/logo`
      ) {
        return createErrorResponse(500, 'Logo storage unavailable');
      }

      throw new Error(`Unexpected request: ${request.method} ${request.path}`);
    });

    let originalConfirm: ((message?: string) => boolean) | undefined;

    try {
      const { container, root, window } = await renderApp('/companies/new');
      testWindow = window;
      originalConfirm = window.confirm;

      await fillCompanyName(window, 'Northwind Labs');
      await selectLogoFile(window, createLogoFile(window));

      const submitButton = container.querySelector(
        'button[type="submit"]',
      ) as HTMLButtonElement | null;

      assert.ok(submitButton, 'Expected the create company submit button');

      await clickButton(window, submitButton);

      const beforeUnloadEvent = new window.Event('beforeunload', {
        cancelable: true,
      }) as BeforeUnloadEvent;

      await act(async () => {
        window.dispatchEvent(beforeUnloadEvent);
        await renderTick();
      });

      assert.equal(beforeUnloadEvent.defaultPrevented, true);

      Object.defineProperty(window, 'confirm', {
        value: () => false,
        configurable: true,
        writable: true,
      });

      const cancelButton = findButtonByText(container, 'Cancel');
      assert.ok(cancelButton, 'Expected the cancel action');

      await clickButton(window, cancelButton);

      assert.equal(window.location.pathname, '/companies/new');

      Object.defineProperty(window, 'confirm', {
        value: () => true,
        configurable: true,
        writable: true,
      });

      await clickButton(window, cancelButton);

      assert.equal(window.location.pathname, routes.companies);

      await act(async () => {
        root.unmount();
      });
    } finally {
      if (originalConfirm && testWindow) {
        Object.defineProperty(testWindow, 'confirm', {
          value: originalConfirm,
          configurable: true,
          writable: true,
        });
      }
      restoreFetch();
    }
  }

  console.log('create company route checks passed');
})();

import assert from 'node:assert/strict';

import { act } from 'react';

import { routes } from '~/routes';

import {
  cleanupRoot,
  clickButton,
  createErrorResponse,
  createJsonResponse,
  createLogoFile,
  fillCompanyName,
  findButtonByText,
  getRequestDetails,
  renderApp,
  renderTick,
  restoreFetch,
  selectLogoFile,
  setFetch,
  type TestWindow,
} from './createCompany.route.test.utils';

const actBeforeUnload = async (
  window: TestWindow,
  beforeUnloadEvent: BeforeUnloadEvent,
) => {
  await act(async () => {
    window.dispatchEvent(beforeUnloadEvent);
    await renderTick();
  });
};

await (async () => {
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

      await cleanupRoot(root);
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

      await actBeforeUnload(window, beforeUnloadEvent);
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

      await cleanupRoot(root);
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

  console.log('create company failure route checks passed');
})();

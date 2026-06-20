import assert from 'node:assert/strict';

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
  restoreFetch,
  selectLogoFile,
  setFetch,
} from './createCompany.route.test.utils';

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

      await cleanupRoot(root);
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

      await cleanupRoot(root);
    } finally {
      restoreFetch();
    }
  }

  console.log('create company success route checks passed');
})();

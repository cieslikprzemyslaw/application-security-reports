import {
  act,
  assert,
  createJsonResponse,
  renderApp,
  renderTick,
  restoreFetch,
  routes,
  setFetch,
  textContent,
} from './support';

export const runCompanyListAndCreationTests = async () => {
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
    const companyId = 'cmp_2';
    let companyCreated = false;

    setFetch(async (input, init) => {
      const request = input instanceof Request ? input : undefined;
      const method = (init?.method ?? request?.method ?? 'GET').toUpperCase();
      const path = new URL(request?.url ?? String(input), 'http://localhost')
        .pathname;

      if (method === 'GET' && path === '/api/companies') {
        return createJsonResponse({
          data: companyCreated
            ? [
                {
                  id: companyId,
                  name: 'Northwind Labs',
                  website: 'https://northwind.example',
                  contactEmail: 'security@northwind.example',
                  assessmentCount: 1,
                  createdAt: '2026-06-01T00:00:00.000Z',
                  updatedAt: '2026-06-10T00:00:00.000Z',
                },
              ]
            : [],
        });
      }

      if (method === 'POST' && path === '/api/companies') {
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

      if (method === 'GET' && path === `/api/companies/${companyId}/overview`) {
        return createJsonResponse({
          data: {
            company: {
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

      throw new Error(`Unexpected request: ${method} ${path}`);
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
        await renderTick();
      });

      assert.equal(window.location.pathname, '/companies/new');

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
    setFetch(async () => createJsonResponse({ data: [] }));

    try {
      const { container, root } = await renderApp('/companies/new');

      assert.equal(window.location.pathname, '/companies/new');
      assert.ok(
        window.document.querySelector('input#company-name'),
        'Expected the create company form to render at /companies/new',
      );
      assert.ok(
        textContent(container).includes('Create company'),
        'Expected the create company heading',
      );
      assert.ok(
        !container.querySelector('.drawer-panel input#company-name'),
        'Expected the create form to be in page content, not the aside',
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
      const { container, root } = await renderApp('/companies/new');

      const cancelButton = Array.from(
        container.querySelectorAll('button'),
      ).find(button => button.textContent?.includes('Cancel')) as
        | HTMLButtonElement
        | undefined;

      assert.ok(cancelButton, 'Expected a cancel action');

      await act(async () => {
        cancelButton.dispatchEvent(
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
        '/companies',
        'Expected cancel to return to the companies list',
      );
      assert.ok(textContent(container).includes('Companies'));

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }
};

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

export const runCompanySwitcherNavigationTests = async () => {
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
              logoUrl: null,
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

      if (path === '/api/companies/cmp_1/assessments') {
        return createJsonResponse({ data: [] });
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
              logoUrl: null,
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
      const { container, root } = await renderApp(
        `${routes.companyWorkspaceAssessments('cmp_1')}?status=archived`,
      );
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
      assert.equal(window.location.search, '');

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

      assert.equal(window.location.pathname, '/companies/new');
      assert.ok(
        window.document.querySelector('input#company-name'),
        'Expected the create company form to render from the switcher',
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

      const viewAllButton = document.querySelector(
        '.company-switcher-actions-link',
      ) as HTMLButtonElement | null;

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
};

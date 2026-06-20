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

export const runDashboardRecentCompanyTests = async () => {
  {
    setFetch(async input => {
      const path = String(input);

      if (path === '/api/companies') {
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
              logoUrl: null,
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
    setFetch(async input => {
      const path = String(input);

      if (path === '/api/companies') {
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
              logoUrl: null,
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
      const { container, root } = await renderApp('/dashboard', true, {
        'appsec-company-switcher-recents': JSON.stringify(['cmp_2', 'cmp_1']),
        'appsec-company-switcher-recent-open-times': JSON.stringify({
          cmp_2: '2026-06-14T16:45:00.000Z',
          cmp_1: '2026-06-15T08:15:00.000Z',
        }),
      });

      const companyTitles = Array.from(
        container.querySelectorAll('.dashboard-company-name'),
      ).map(node => node.textContent);

      assert.deepEqual(companyTitles.slice(0, 3), [
        'Meridian Finance',
        'Northwind Labs',
        'Summit Health',
      ]);
      assert.ok(textContent(container).includes('Last opened'));

      const companyRows = Array.from(
        container.querySelectorAll('.dashboard-recent-company-row'),
      ) as HTMLButtonElement[];

      assert.equal(companyRows.length, 3, 'Expected three recent company rows');
      assert.equal(companyRows[0]?.tagName, 'BUTTON');

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

      assert.equal(window.location.pathname, '/companies/new');
      assert.ok(
        window.document.querySelector('input#company-name'),
        'Expected the create company form to render from the dashboard',
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
};

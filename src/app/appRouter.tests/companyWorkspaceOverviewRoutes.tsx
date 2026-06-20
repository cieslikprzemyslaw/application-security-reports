import {
  act,
  assert,
  createJsonResponse,
  renderApp,
  restoreFetch,
  routes,
  setFetch,
  textContent,
} from './support';

export const runCompanyWorkspaceOverviewRouteTests = async () => {
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
              logoUrl: null,
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
              logoUrl: null,
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
              logoUrl: null,
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
};

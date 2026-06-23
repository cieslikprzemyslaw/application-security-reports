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

export const runCompanyWorkspaceChildRouteTests = async () => {
  {
    setFetch(async input => {
      const path = String(input);

      if (path === '/api/companies') {
        return createJsonResponse({
          data: [
            {
              id: 'cmp_00000000-0000-0000-0000-000000000001',
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

      if (
        path ===
        '/api/companies/cmp_00000000-0000-0000-0000-000000000001/overview'
      ) {
        return createJsonResponse({
          data: {
            company: {
              id: 'cmp_00000000-0000-0000-0000-000000000001',
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
        routes.companyWorkspaceAssessments(
          'cmp_00000000-0000-0000-0000-000000000001',
        ),
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
              id: 'cmp_00000000-0000-0000-0000-000000000001',
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

      if (
        path ===
        '/api/companies/cmp_00000000-0000-0000-0000-000000000001/overview'
      ) {
        return createJsonResponse({
          data: {
            company: {
              id: 'cmp_00000000-0000-0000-0000-000000000001',
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
      const { container, root } = await renderApp(
        routes.companyWorkspaceReports(
          'cmp_00000000-0000-0000-0000-000000000001',
        ),
      );

      assert.ok(textContent(container).includes('Report Preview'));
      assert.equal(
        window.location.pathname,
        routes.companyWorkspaceReports(
          'cmp_00000000-0000-0000-0000-000000000001',
        ),
      );

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }
};

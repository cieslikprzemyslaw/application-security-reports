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

const company = {
  id: 'cmp_00000000-0000-0000-0000-000000000101',
  name: 'Northwind Labs',
  description: 'Cloud security partner',
  website: 'https://northwind.example',
  contactName: 'Alex Example',
  contactEmail: 'security@northwind.example',
  logoUrl: null,
  footerText: 'Confidential',
  assessmentCount: 2,
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-10T00:00:00.000Z',
};

const getRequestDetails = (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : undefined;

  return {
    method: (init?.method ?? request?.method ?? 'GET').toUpperCase(),
    path: new URL(request?.url ?? String(input), 'http://localhost').pathname,
  };
};

const createErrorResponse = (status: number, message: string) =>
  createJsonResponse(
    {
      error: {
        code: 'COMPANY_WORKFLOW_TEST_FAILURE',
        message,
        details: [],
      },
    },
    { status },
  );

const settle = async () => {
  await act(async () => {
    await renderTick();
    await renderTick();
    await renderTick();
  });
};

const click = async (element: HTMLElement) => {
  await act(async () => {
    element.dispatchEvent(
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

export const runCompanyWorkflowStateTests = async () => {
  {
    setFetch(() => new Promise<Response>(() => undefined));

    try {
      const { container, root } = await renderApp('/companies', false);

      await settle();

      assert.ok(
        container.querySelector('.companies-status'),
        'Expected the Companies loading state',
      );
      assert.ok(
        textContent(container).includes('Loading companies...'),
        'Expected loading text from the Companies page',
      );

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    setFetch(async (input, init) => {
      const request = getRequestDetails(input, init);

      if (request.method === 'GET' && request.path === '/api/companies') {
        return createJsonResponse({ data: [] });
      }

      throw new Error(`Unexpected request: ${request.method} ${request.path}`);
    });

    try {
      const { container, root } = await renderApp('/companies');

      assert.ok(
        container.querySelector('.companies-card'),
        'Expected the production Companies page',
      );
      assert.ok(
        textContent(container).includes('No companies yet'),
        'Expected the empty workspace state',
      );
      assert.ok(
        container.querySelector('.company-table__empty-cell'),
        'Expected the Companies table empty state',
      );

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    let listRequests = 0;

    setFetch(async (input, init) => {
      const request = getRequestDetails(input, init);

      if (request.method === 'GET' && request.path === '/api/companies') {
        listRequests += 1;

        if (listRequests <= 2) {
          return createErrorResponse(
            503,
            'Companies service temporarily unavailable.',
          );
        }

        return createJsonResponse({ data: [company] });
      }

      throw new Error(`Unexpected request: ${request.method} ${request.path}`);
    });

    try {
      const { container, root } = await renderApp('/companies');

      assert.ok(
        textContent(container).includes('Unable to load companies'),
        'Expected the Companies error state',
      );
      assert.ok(
        textContent(container).includes(
          'Companies service temporarily unavailable.',
        ),
        'Expected the safe service error',
      );

      const retryButton = Array.from(container.querySelectorAll('button')).find(
        button => button.textContent?.trim() === 'Retry',
      );

      assert.ok(retryButton, 'Expected the Companies retry action');

      await click(retryButton);

      assert.ok(
        container.querySelector('.company-table__name')?.textContent ===
          company.name,
        'Expected the populated table after retry',
      );
      assert.ok(
        listRequests >= 3,
        'Expected retry to perform another list request',
      );

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    setFetch(async (input, init) => {
      const request = getRequestDetails(input, init);

      if (request.method === 'GET' && request.path === '/api/companies') {
        return createJsonResponse({ data: [company] });
      }

      if (
        request.method === 'GET' &&
        request.path === `/api/companies/${company.id}/overview`
      ) {
        return createJsonResponse({
          data: {
            company,
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

      throw new Error(`Unexpected request: ${request.method} ${request.path}`);
    });

    try {
      const { container, root } = await renderApp('/companies');

      const companyRow = Array.from(
        container.querySelectorAll<HTMLElement>('.company-table__row'),
      ).find(row => row.textContent?.includes(company.name));

      assert.ok(companyRow, 'Expected the populated company row');

      await click(companyRow);

      assert.equal(
        window.location.pathname,
        routes.companyWorkspaceOverview(company.id),
      );
      assert.equal(
        container.querySelector('.sidebar-company-switcher-name')?.textContent,
        company.name,
        'Expected the selected company to become active',
      );

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }
};

import {
  act,
  fireEvent,
  waitFor,
  assert,
  Companies,
  createJsonResponse,
  renderComponent,
  renderTick,
  restoreFetch,
  setFetch,
  textContent,
} from './support';

import { routes } from '~/routes';

export const runCompaniesEmptySearchAndErrorStateTests = async () => {
  {
    setFetch(async input => {
      assert.equal(String(input), '/api/companies');
      return createJsonResponse({ data: [] });
    });

    try {
      const { container, root } = await renderComponent(
        <Companies
          activeCompany={{ id: 'cmp_1', name: 'Northwind Labs' }}
          onActiveCompanyChange={() => undefined}
        />,
      );

      assert.ok(textContent(container).includes('No companies yet'));
      assert.ok(textContent(container).includes('New company'));
      assert.ok(
        container.querySelector('[role="status"]'),
        'Expected the empty state to announce itself politely',
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
      return createJsonResponse({
        data: [
          {
            id: 'cmp_1',
            name: 'Northwind Labs',
            description: 'Cloud security partner',
            website: 'https://northwind.example',
            contactName: 'A. Example',
            contactEmail: 'security@northwind.example',
            logoUrl: null,
            footerText: 'Confidential',
            assessmentCount: 2,
            createdAt: '2026-06-01T00:00:00.000Z',
            updatedAt: '2026-06-10T00:00:00.000Z',
          },
        ],
      });
    });

    try {
      const { container, root } = await renderComponent(
        <Companies
          activeCompany={{ id: 'cmp_1', name: 'Northwind Labs' }}
          onActiveCompanyChange={() => undefined}
        />,
      );

      const searchInput = container.querySelector(
        'input[placeholder="Search companies..."]',
      ) as HTMLInputElement | null;

      assert.ok(searchInput, 'Expected the companies search input');

      await act(async () => {
        fireEvent.change(searchInput!, {
          target: { value: 'zebra' },
        });
        await renderTick();
      });

      assert.ok(textContent(container).includes('No companies match "zebra"'));
      assert.ok(textContent(container).includes('Clear search'));

      const clearButton = Array.from(container.querySelectorAll('button')).find(
        button => button.textContent?.includes('Clear search'),
      );

      assert.ok(clearButton, 'Expected a clear search action');

      await act(async () => {
        clearButton.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
        await renderTick();
      });

      assert.equal(searchInput?.value, '');

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
      const { container, root } = await renderComponent(
        <Companies
          activeCompany={{ id: 'cmp_1', name: 'Northwind Labs' }}
          onActiveCompanyChange={() => undefined}
        />,
      );

      const newCompanyButton = Array.from(
        container.querySelectorAll('button'),
      ).find(button => button.textContent?.includes('New company'));

      assert.ok(newCompanyButton, 'Expected a new company action');

      await act(async () => {
        fireEvent.click(newCompanyButton!);
        await renderTick();
      });

      await waitFor(() => {
        assert.equal(
          container.querySelector('[data-testid="test-location"]')?.textContent,
          routes.companiesNew,
          'Expected the New company action to navigate to the create route',
        );
      });

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }
};

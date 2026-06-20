import {
  act,
  assert,
  Companies,
  createJsonResponse,
  renderComponent,
  renderTick,
  restoreFetch,
  setFetch,
  textContent,
} from './support';

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
        searchInput!.value = 'zebra';
        searchInput?.dispatchEvent(
          new window.Event('input', {
            bubbles: true,
            cancelable: true,
          }),
        );
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
    const validationPayload = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: [
          {
            path: 'name',
            message: 'Text is required',
          },
        ],
      },
    };

    let requestCount = 0;

    setFetch(async input => {
      requestCount += 1;

      if (requestCount === 1) {
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

      if (String(input) === '/api/companies' && requestCount === 2) {
        return createJsonResponse(validationPayload, { status: 400 });
      }

      return createJsonResponse({
        data: {
          id: 'cmp_2',
          name: 'Northwind Labs',
          website: 'https://northwind.example',
          contactEmail: 'security@northwind.example',
          assessmentCount: 2,
          createdAt: '2026-06-01T00:00:00.000Z',
          updatedAt: '2026-06-10T00:00:00.000Z',
        },
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
        newCompanyButton.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
        await renderTick();
      });

      assert.ok(textContent(container).includes('Create company'));

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

      assert.ok(createButton, 'Expected a create company submit action');

      await act(async () => {
        createButton.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
        await renderTick();
      });

      assert.ok(textContent(container).includes('Could not save company'));
      assert.ok(textContent(container).includes('Text is required'));

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }
};

import {
  act,
  fireEvent,
  assert,
  Assessments,
  createJsonResponse,
  renderComponent,
  restoreFetch,
  setFetch,
  textContent,
  waitFor,
} from './support';

export const runAssessmentsPageStateTests = async () => {
  {
    setFetch(async () =>
      createJsonResponse({
        data: [],
      }),
    );

    try {
      const { container, root } = await renderComponent(
        <Assessments companyId="cmp_1" companyName="Northstar Digital" />,
      );

      assert.ok(textContent(container).includes('No assessments yet'));
      assert.ok(textContent(container).includes('New assessment'));

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
            id: 'asm_1',
            name: 'Northwind Portal',
            type: 'Web App',
            status: 'draft',
            findingsCount: 7,
            updatedAt: '2026-06-14T10:15:00.000Z',
            description: 'Assessment of the customer portal',
            scope: 'Web application',
          },
        ],
      }),
    );

    try {
      const { container, root } = await renderComponent(
        <Assessments companyId="cmp_1" companyName="Northstar Digital" />,
      );

      assert.ok(textContent(container).includes('Northwind Portal'));
      assert.ok(textContent(container).includes('Findings'));
      assert.ok(textContent(container).includes('Updated'));

      const searchInput = container.querySelector(
        'input[placeholder="Search assessments..."]',
      ) as HTMLInputElement | null;

      assert.ok(searchInput, 'Expected the assessments search input');

      fireEvent.change(searchInput!, {
        target: { value: 'missing' },
      });

      await waitFor(() => {
        assert.ok(
          textContent(container).includes(
            'No assessments match your current search and filters',
          ),
        );
      });
      assert.ok(textContent(container).includes('Clear filters'));

      const clearButton = Array.from(container.querySelectorAll('button')).find(
        button => button.textContent?.includes('Clear filters'),
      );

      assert.ok(clearButton, 'Expected a clear filters action');

      fireEvent.click(clearButton);

      await waitFor(() => {
        assert.equal(searchInput?.value, '');
      });

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }
};

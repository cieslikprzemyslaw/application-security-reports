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

export const runCompaniesFocusAndRowSelectionTests = async () => {
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
        ],
      }),
    );

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
        await renderTick();
      });

      const nameInput = window.document.querySelector(
        'input#company-name',
      ) as HTMLInputElement | null;

      assert.ok(nameInput, 'Expected the company name field');
      assert.equal(
        window.document.activeElement,
        nameInput,
        'Expected the name field to keep focus after the drawer opens',
      );

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

      assert.equal(
        window.document.activeElement,
        nameInput,
        'Expected typing to keep focus in the company name field',
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
            id: 'cmp_1',
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
      const { container, root } = await renderComponent(
        <Companies
          activeCompany={{ id: 'cmp_1', name: 'Northwind Labs' }}
          onActiveCompanyChange={() => undefined}
        />,
      );

      const companyRow = Array.from(
        container.querySelectorAll('.company-table__row'),
      )[0] as HTMLTableRowElement | undefined;

      assert.ok(companyRow, 'Expected a company row');

      await act(async () => {
        companyRow.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
        await renderTick();
      });

      assert.ok(textContent(container).includes('Edit company'));
      assert.equal(
        (
          window.document.querySelector(
            'input#company-name',
          ) as HTMLInputElement
        )?.value,
        'Northwind Labs',
      );

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }
};

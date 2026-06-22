import {
  act,
  fireEvent,
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

      const actionsButton = container.querySelector(
        'button[aria-label="Actions for Northwind Labs"]',
      ) as HTMLButtonElement | null;
      assert.ok(actionsButton, 'Expected company row actions');

      await act(async () => {
        fireEvent.click(actionsButton!);
        await renderTick();
      });

      const editMenuItem = Array.from(
        window.document.querySelectorAll<HTMLElement>('[role="menuitem"]'),
      ).find(item => item.textContent?.trim() === 'Edit');
      assert.ok(editMenuItem, 'Expected an Edit menu item');

      await act(async () => {
        fireEvent.click(editMenuItem!);
        await renderTick();
        await renderTick();
      });

      const nameInput = window.document.querySelector(
        'input#company-name',
      ) as HTMLInputElement | null;
      assert.ok(nameInput, 'Expected the company name field');
      assert.equal(nameInput?.value, 'Northwind Labs');

      nameInput!.focus();

      await act(async () => {
        fireEvent.change(nameInput!, {
          target: { value: 'Northwind Security Labs' },
        });
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
      const selectedCompanies: Array<{ id: string; name: string }> = [];
      const { container, root } = await renderComponent(
        <Companies
          activeCompany={{ id: 'cmp_other', name: 'Other Company' }}
          onActiveCompanyChange={company => {
            if (company) {
              selectedCompanies.push(company);
            }
          }}
        />,
      );

      const companyRow = container.querySelector(
        '.company-table__row',
      ) as HTMLTableRowElement | null;
      assert.ok(companyRow, 'Expected a company row');

      await act(async () => {
        fireEvent.click(companyRow!);
        await renderTick();
      });

      assert.equal(selectedCompanies.length, 1);
      assert.equal(selectedCompanies[0]?.id, 'cmp_1');
      assert.equal(
        textContent(window.document.body).includes('Edit company'),
        false,
        'Expected row selection not to open the edit drawer',
      );

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }
};

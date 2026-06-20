import {
  act,
  assert,
  createJsonResponse,
  renderApp,
  renderTick,
  restoreFetch,
  setFetch,
  textContent,
} from './support';

export const runCompanyWorkspaceMissingNavigationTests = async () => {
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
        '/companies/cmp_missing/overview',
      );

      assert.ok(textContent(container).includes('Company not found'));
      assert.ok(textContent(container).includes('Return to companies'));
      assert.equal(window.location.pathname, '/companies/cmp_missing/overview');

      const returnLink = container.querySelector(
        'a[href="/companies"]',
      ) as HTMLAnchorElement | null;

      assert.ok(returnLink, 'Expected the return link');

      await act(async () => {
        returnLink.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
        await renderTick();
        await renderTick();
      });

      assert.equal(window.location.pathname, '/companies');
      assert.ok(textContent(container).includes('Companies'));

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }
};

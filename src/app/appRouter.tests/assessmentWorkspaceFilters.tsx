import {
  act,
  assert,
  renderApp,
  renderTick,
  restoreFetch,
  routes,
  setupAssessmentWorkspaceFetchFixture,
  textContent,
} from './support';

export const runAssessmentWorkspaceFilterTests = async () => {
  setupAssessmentWorkspaceFetchFixture();

  try {
    {
      const { container, root } = await renderApp(
        `${routes.companyWorkspaceAssessments(
          'cmp_1',
        )}?search=Data&status=archived&type=API&sort=name&direction=asc&page=2`,
      );

      assert.equal(
        window.location.pathname,
        routes.companyWorkspaceAssessments('cmp_1'),
      );
      assert.equal(
        new URLSearchParams(window.location.search).get('search'),
        'Data',
      );
      assert.ok(textContent(container).includes('Data Export Service'));
      assert.ok(!textContent(container).includes('Customer Services Portal'));

      const searchInput = container.querySelector(
        'input[placeholder="Search assessments..."]',
      ) as HTMLInputElement | null;

      assert.equal(searchInput?.value, 'Data');

      await act(async () => {
        root.unmount();
      });
    }

    {
      const { container, root } = await renderApp(
        `${routes.companyWorkspaceAssessments(
          'cmp_1',
        )}?search=Data&status=missing&type=missing&sort=bad&direction=sideways&page=-1`,
      );

      await act(async () => {
        await renderTick();
      });

      assert.equal(
        window.location.pathname,
        routes.companyWorkspaceAssessments('cmp_1'),
      );
      assert.equal(window.location.search, '?search=Data');
      assert.ok(textContent(container).includes('Data Export Service'));

      await act(async () => {
        root.unmount();
      });
    }

    {
      const { container, root } = await renderApp(
        `${routes.companyWorkspaceAssessments('cmp_1')}?page=2`,
      );

      const statusSelect = Array.from(
        container.querySelectorAll('select'),
      ).find(select =>
        Array.from(select.options).some(option => option.value === 'archived'),
      ) as HTMLSelectElement | undefined;

      assert.ok(statusSelect, 'Expected the status filter');

      await act(async () => {
        statusSelect!.focus();
        assert.equal(window.document.activeElement, statusSelect);
        statusSelect!.value = 'archived';
        statusSelect!.dispatchEvent(
          new window.Event('change', {
            bubbles: true,
            cancelable: true,
          }),
        );
        await renderTick();
        await renderTick();
      });

      assert.equal(
        new URLSearchParams(window.location.search).get('status'),
        'archived',
      );
      assert.equal(
        new URLSearchParams(window.location.search).get('page'),
        null,
      );
      assert.ok(textContent(container).includes('Data Export Service'));
      assert.ok(!textContent(container).includes('Customer Services Portal'));

      await act(async () => {
        window.history.back();
        await renderTick();
        await renderTick();
      });

      assert.equal(window.location.search, '?page=2');
      assert.ok(textContent(container).includes('Customer Services Portal'));
      assert.ok(textContent(container).includes('Data Export Service'));

      await act(async () => {
        root.unmount();
      });
    }
  } finally {
    restoreFetch();
  }
};

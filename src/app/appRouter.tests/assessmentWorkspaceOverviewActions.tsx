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

export const runAssessmentWorkspaceOverviewActionTests = async () => {
  setupAssessmentWorkspaceFetchFixture();

  try {
    {
      const { container, root } = await renderApp(
        routes.assessmentDetailsOverview('cmp_1', 'asm_1'),
      );

      assert.ok(textContent(container).includes('Customer Services Portal'));
      assert.equal(
        textContent(container).includes('asm_1'),
        false,
        'Expected the Assessment ID to stay hidden from the UI',
      );
      assert.equal(
        container.querySelector('[role="tablist"]')?.getAttribute('aria-label'),
        'Assessment sections',
      );
      assert.equal(
        window.location.pathname,
        routes.assessmentDetailsOverview('cmp_1', 'asm_1'),
      );
      assert.equal(
        container.querySelector('[role="tab"][aria-selected="true"]')
          ?.textContent,
        'Overview',
      );

      await act(async () => {
        root.unmount();
      });
    }

    {
      const { container, root } = await renderApp(
        routes.assessmentDetailsOverview('cmp_1', 'asm_1'),
      );

      const completeButton = Array.from(
        container.querySelectorAll('button'),
      ).find(button => button.textContent?.includes('Complete')) as
        | HTMLButtonElement
        | undefined;

      assert.ok(completeButton, 'Expected a complete action');

      await act(async () => {
        completeButton!.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
        await renderTick();
        await renderTick();
      });

      assert.ok(
        textContent(container).includes('Assessment changed elsewhere'),
      );

      await act(async () => {
        root.unmount();
      });
    }

    {
      const { container, root } = await renderApp(
        routes.assessmentDetails('cmp_1', 'asm_1'),
      );

      assert.ok(textContent(container).includes('Customer Services Portal'));
      assert.equal(
        window.location.pathname,
        routes.assessmentDetails('cmp_1', 'asm_1'),
      );
      assert.equal(
        container.querySelector('[role="tab"][aria-selected="true"]')
          ?.textContent,
        'Overview',
      );

      await act(async () => {
        root.unmount();
      });
    }
  } finally {
    restoreFetch();
  }
};

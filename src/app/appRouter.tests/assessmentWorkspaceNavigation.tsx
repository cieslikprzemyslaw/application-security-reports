import {
  act,
  assert,
  renderApp,
  renderTick,
  restoreFetch,
  routes,
  setupAssessmentWorkspaceFetchFixture,
  textContent,
  waitFor,
} from './support';

export const runAssessmentWorkspaceNavigationTests = async () => {
  setupAssessmentWorkspaceFetchFixture();

  try {
    {
      const { container, root } = await renderApp(
        `${routes.companyWorkspaceAssessments('cmp_1')}?page=2`,
      );

      assert.ok(textContent(container).includes('Customer Services Portal'));
      assert.ok(textContent(container).includes('Data Export Service'));

      const editableAction = container.querySelector<HTMLAnchorElement>(
        'a[aria-label="Open Customer Services Portal assessment"]',
      );
      const editableRow = editableAction?.closest('tr');

      assert.ok(editableAction, 'Expected an editable assessment link');
      assert.ok(editableRow, 'Expected the assessment link inside its row');
      assert.equal(editableRow?.tabIndex, -1);

      await act(async () => {
        editableAction!.focus();
        assert.equal(window.document.activeElement, editableAction);
        editableAction!.click();
        await renderTick();
        await renderTick();
      });

      await waitFor(() => {
        assert.equal(
          window.location.pathname,
          routes.assessmentDetailsOverview('cmp_1', 'asm_1'),
        );
        assert.equal(
          container.querySelector('[role="tab"][aria-selected="true"]')
            ?.textContent,
          'Overview',
        );
      });

      const findingsTab = Array.from(
        container.querySelectorAll('[role="tab"]'),
      ).find(button => button.textContent?.startsWith('Findings')) as
        | HTMLButtonElement
        | undefined;

      assert.ok(findingsTab, 'Expected the Findings tab');

      await act(async () => {
        findingsTab!.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
        await renderTick();
        await renderTick();
      });

      assert.equal(
        window.location.pathname,
        routes.assessmentDetailsFindings('cmp_1', 'asm_1'),
      );
      assert.ok(textContent(container).includes('Add threat'));

      await act(async () => {
        root.unmount();
      });
    }

    {
      const { container, root } = await renderApp(
        routes.companyWorkspaceAssessments('cmp_1'),
      );

      const archivedAction = container.querySelector<HTMLAnchorElement>(
        'a[aria-label="Open Data Export Service assessment"]',
      );
      const archivedRow = archivedAction?.closest('tr');

      assert.ok(archivedAction, 'Expected an archived assessment link');
      assert.ok(archivedRow, 'Expected the archived link inside its row');
      assert.equal(archivedRow?.tabIndex, -1);

      await act(async () => {
        archivedAction!.click();
        await renderTick();
        await renderTick();
      });

      assert.equal(
        window.location.pathname,
        routes.assessmentDetailsOverview('cmp_1', 'asm_5'),
      );
      assert.ok(textContent(container).includes('read-only'));

      const findingsTab = Array.from(
        container.querySelectorAll('[role="tab"]'),
      ).find(button => button.textContent?.startsWith('Findings')) as
        | HTMLButtonElement
        | undefined;

      assert.ok(
        findingsTab,
        'Expected the Findings tab for the archived assessment',
      );

      await act(async () => {
        findingsTab!.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
        await renderTick();
        await renderTick();
      });

      assert.equal(
        window.location.pathname,
        routes.assessmentDetailsFindings('cmp_1', 'asm_5'),
      );
      assert.ok(
        !textContent(container).includes('Add threat'),
        'Expected archived assessments to hide the create action',
      );

      await act(async () => {
        root.unmount();
      });
    }
  } finally {
    restoreFetch();
  }
};

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

      const editableRow = Array.from(
        container.querySelectorAll('.assessment-table__row'),
      ).find(row => row.textContent?.includes('Customer Services Portal')) as
        | HTMLTableRowElement
        | undefined;

      assert.ok(editableRow, 'Expected an editable assessment row');
      assert.equal(editableRow?.tabIndex, 0);

      await act(async () => {
        editableRow!.focus();
        assert.equal(window.document.activeElement, editableRow);
        editableRow!.dispatchEvent(
          new window.KeyboardEvent('keydown', {
            bubbles: true,
            cancelable: true,
            key: 'Enter',
          }),
        );
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

      const archivedRow = Array.from(
        container.querySelectorAll('.assessment-table__row'),
      ).find(row => row.textContent?.includes('Data Export Service')) as
        | HTMLTableRowElement
        | undefined;

      assert.ok(archivedRow, 'Expected an archived assessment row');

      await act(async () => {
        archivedRow!.dispatchEvent(
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

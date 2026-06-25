import {
  act,
  assert,
  renderApp,
  restoreFetch,
  routes,
  setupAssessmentWorkspaceFetchFixture,
  textContent,
  waitFor,
} from './support';

export const runAssessmentWorkspaceReportsAndMissingTests = async () => {
  setupAssessmentWorkspaceFetchFixture();

  try {
    {
      const { container, root } = await renderApp(
        routes.assessmentDetailsHistory('cmp_1', 'asm_5'),
      );

      assert.ok(textContent(container).includes('read-only'));
      assert.ok(textContent(container).includes('Archived'));
      assert.ok(
        !Array.from(container.querySelectorAll('button')).some(button =>
          button.textContent?.includes('Edit assessment'),
        ),
      );

      await act(async () => {
        root.unmount();
      });
    }

    {
      const { container, root } = await renderApp(
        routes.assessmentDetailsReports('cmp_1', 'asm_1'),
      );

      await waitFor(() => {
        assert.ok(
          textContent(container).includes('Customer Portal Security Report'),
        );
        assert.ok(textContent(container).includes('Open preview'));
      });
      assert.equal(
        window.location.pathname,
        routes.assessmentDetailsReports('cmp_1', 'asm_1'),
      );
      assert.equal(
        container.querySelector('[role="tab"][aria-selected="true"]')
          ?.textContent,
        'Reports2',
      );

      await act(async () => {
        root.unmount();
      });
    }

    {
      const { container, root } = await renderApp(
        '/companies/cmp_1/assessments/asm_missing',
      );

      assert.ok(textContent(container).includes('Assessment not found'));
      assert.ok(textContent(container).includes('Return to assessments'));
      assert.equal(
        window.location.pathname,
        '/companies/cmp_1/assessments/asm_missing',
      );

      await act(async () => {
        root.unmount();
      });
    }
  } finally {
    restoreFetch();
  }
};

import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import {
  act,
  renderApp,
  restoreFetch,
  routes,
  textContent,
  waitFor,
} from '~/app/appRouter.tests/support';
import {
  latestReportVersion,
  reportDetailsCompanyId,
  reportDetailsReportId,
  setupReportDetailsFetchFixture,
} from '~/app/appRouter.tests/reportDetailsFixture';

const findButton = (container: HTMLElement, label: string) =>
  Array.from(container.querySelectorAll('button')).find(
    button => button.textContent?.trim() === label,
  );

describe('Report printing through the production router', () => {
  it('prints the saved Preview while the Data tab is active', async () => {
    const calls = setupReportDetailsFetchFixture();
    const originalPrint = window.print;
    let printCalls = 0;

    Object.defineProperty(window, 'print', {
      configurable: true,
      value: () => {
        printCalls += 1;
      },
    });

    try {
      const { container, root } = await renderApp(
        routes.reportDetails(reportDetailsCompanyId, reportDetailsReportId),
      );

      await waitFor(() => {
        assert.ok(textContent(container).includes('Current Customer Portal'));
      });

      const dataButton = findButton(container, 'Data');

      assert.ok(dataButton, 'Expected the Report Data tab');

      await act(async () => {
        dataButton.click();
      });

      await waitFor(() => {
        assert.ok(textContent(container).includes(latestReportVersion.id));
      });

      const previewPanel = container.querySelector(
        '.report-preview-shell-panel--preview',
      );
      const dataPanel = container.querySelector(
        '.report-preview-shell-panel--data',
      );
      const printButton = findButton(container, 'Print');

      assert.ok(previewPanel, 'Expected the printable Preview panel');
      assert.ok(dataPanel, 'Expected the active Data panel');
      assert.ok(printButton, 'Expected the browser Print action');

      assert.ok(
        previewPanel.classList.contains('report-preview-shell-panel--inactive'),
      );
      assert.ok(
        dataPanel.classList.contains('report-preview-shell-panel--active'),
      );
      assert.ok(
        textContent(previewPanel as HTMLElement).includes(
          'Current Customer Portal',
        ),
      );
      assert.ok(
        textContent(previewPanel as HTMLElement).includes(
          'The request returned another user’s order.',
        ),
        'Expected saved Evidence in the printable Preview',
      );

      await act(async () => {
        printButton.click();
      });

      assert.equal(printCalls, 1);
      assert.ok(
        calls.includes(`/api/reports/${reportDetailsReportId}/versions`),
      );

      await act(async () => {
        root.unmount();
      });
    } finally {
      Object.defineProperty(window, 'print', {
        configurable: true,
        value: originalPrint,
      });

      restoreFetch();
    }
  });
});

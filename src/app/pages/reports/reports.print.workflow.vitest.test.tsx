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
  it('opens the PDF print flow for the saved Preview while the Data tab is active', async () => {
    const calls = setupReportDetailsFetchFixture();
    const originalPrint = window.print;
    let printCalls = 0;
    let documentTitleAtPrint = '';
    let originalDocumentTitle = '';

    Object.defineProperty(window, 'print', {
      configurable: true,
      value: () => {
        printCalls += 1;
        documentTitleAtPrint = document.title;
      },
    });

    try {
      const { container, root } = await renderApp(
        routes.reportDetails(reportDetailsCompanyId, reportDetailsReportId),
      );
      originalDocumentTitle = document.title;

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
      const generatePdfButton = findButton(container, 'Generate PDF');

      assert.ok(previewPanel, 'Expected the printable Preview panel');
      assert.ok(dataPanel, 'Expected the active Data panel');
      assert.ok(
        generatePdfButton,
        'Expected the saved-version Generate PDF action',
      );

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
      assert.ok(
        previewPanel.querySelector('.report-evidence-card'),
        'Expected a distinct Evidence card in the printable Preview',
      );
      assert.ok(
        textContent(previewPanel as HTMLElement).includes(
          'Supporting material',
        ),
        'Expected the printable Evidence section heading',
      );

      await act(async () => {
        generatePdfButton.click();
      });

      assert.equal(printCalls, 1);
      assert.equal(
        documentTitleAtPrint,
        'Northstar Digital - Customer Portal Security Report - v1.1',
      );
      assert.equal(document.title, originalDocumentTitle);
      assert.equal(calls.length, 2);
      assert.ok(calls.includes('/api/companies'));
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

import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import {
  act,
  renderApp,
  routes,
  textContent,
  waitFor,
} from '~/app/appRouter.tests/support';

describe('Report workflow through the production router', () => {
  it('supports direct Report navigation and observable Preview/Data state', async () => {
    const { reportCover } = await import('~/app/appData');
    const { container, root } = await renderApp(
      routes.reportDetails(reportCover.reportId),
    );

    await waitFor(() => {
      assert.ok(textContent(container).includes('Report Preview'));
      assert.ok(textContent(container).includes(reportCover.reportId));
    });

    const dataButton = Array.from(container.querySelectorAll('button')).find(
      button => button.textContent?.trim() === 'Data',
    );

    assert.ok(dataButton, 'Expected the Report Data tab');

    await act(async () => {
      dataButton!.dispatchEvent(
        new window.MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          button: 0,
        }),
      );
    });

    await waitFor(() => {
      assert.ok(textContent(container).includes('"reportId"'));
      assert.ok(textContent(container).includes(reportCover.reportId));
    });

    const previewButton = Array.from(container.querySelectorAll('button')).find(
      button => button.textContent?.trim() === 'Preview',
    );

    await act(async () => {
      previewButton?.dispatchEvent(
        new window.MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          button: 0,
        }),
      );
    });

    await waitFor(() => {
      assert.ok(textContent(container).includes(reportCover.applicationName));
      assert.ok(textContent(container).includes('Executive Summary'));
    });

    await act(async () => {
      root.unmount();
    });
  });

  it('renders the Reports workspace through the production route', async () => {
    const { container, root } = await renderApp(routes.reports);

    await waitFor(() => {
      assert.ok(textContent(container).includes('Report Preview'));
      assert.ok(textContent(container).includes('✓ Auto-saved'));
    });

    await act(async () => {
      root.unmount();
    });
  });

  it('keeps a missing Report inside the safe route-level failure state', async () => {
    const { container, root } = await renderApp(
      routes.reportDetails('rpt_missing'),
    );

    await waitFor(() => {
      assert.ok(textContent(container).includes('Report not found'));
      assert.ok(textContent(container).includes('Return to reports'));
      assert.equal(window.location.pathname, '/reports/rpt_missing');
    });

    assert.equal(textContent(container).includes('Report Preview'), false);

    await act(async () => {
      root.unmount();
    });
  });
});

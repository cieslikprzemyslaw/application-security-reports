import {
  act,
  assert,
  renderApp,
  routes,
  textContent,
  waitFor,
} from './support';

export const runReportDetailsAndFallbackRouteTests = async () => {
  {
    const { reportCover } = await import('../appData');

    const { container, root } = await renderApp(
      routes.reportDetails(reportCover.reportId),
    );

    await waitFor(() => {
      assert.ok(textContent(container).includes('Report Preview'));
      assert.ok(textContent(container).includes(reportCover.reportId));
      assert.equal(
        window.location.pathname,
        routes.reportDetails(reportCover.reportId),
      );
    });

    await act(async () => {
      root.unmount();
    });
  }

  {
    const { container, root } = await renderApp('/reports/rpt_missing');

    await waitFor(() => {
      assert.ok(textContent(container).includes('Report not found'));
      assert.ok(textContent(container).includes('Return to reports'));
      assert.equal(window.location.pathname, '/reports/rpt_missing');
    });

    await act(async () => {
      root.unmount();
    });
  }

  {
    const { container, root } = await renderApp('/does-not-exist');

    await waitFor(() => {
      assert.ok(textContent(container).includes('Requested page not found'));
      assert.ok(textContent(container).includes('Back to Dashboard'));
    });

    await act(async () => {
      root.unmount();
    });
  }
};

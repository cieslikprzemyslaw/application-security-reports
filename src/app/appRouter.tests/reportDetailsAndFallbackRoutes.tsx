import {
  act,
  assert,
  renderApp,
  restoreFetch,
  routes,
  textContent,
  waitFor,
} from './support';
import {
  missingReportId,
  oldReportVersionId,
  reportDetailsCompanyId,
  reportDetailsReportId,
  setupReportDetailsFetchFixture,
} from './reportDetailsFixture';

export const runReportDetailsAndFallbackRouteTests = async () => {
  {
    const calls = setupReportDetailsFetchFixture();

    try {
      const { container, root } = await renderApp(
        routes.reportDetails(reportDetailsCompanyId, reportDetailsReportId),
      );

      await waitFor(() => {
        assert.ok(textContent(container).includes('Report Preview'));
        assert.ok(textContent(container).includes('Current Customer Portal'));
        assert.ok(textContent(container).includes('v1.1'));
        assert.ok(container.querySelector('.risk-summary'));
        assert.ok(container.querySelector('.severity-distribution'));
        assert.ok(
          Array.from(container.querySelectorAll('button')).some(
            button => button.textContent?.trim() === 'Generate PDF',
          ),
        );
        assert.equal(
          window.location.pathname,
          routes.reportDetails(reportDetailsCompanyId, reportDetailsReportId),
        );
        assert.equal(
          window.location.pathname,
          routes.reportDetails(reportDetailsCompanyId, reportDetailsReportId),
        );
      });

      assert.ok(
        calls.includes(`/api/reports/${reportDetailsReportId}/versions`),
      );

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    const calls = setupReportDetailsFetchFixture();

    try {
      const { container, root } = await renderApp(
        routes.reportDetailsVersion(
          reportDetailsCompanyId,
          reportDetailsReportId,
          oldReportVersionId,
        ),
      );

      await waitFor(() => {
        assert.ok(
          textContent(container).includes('<img src=x onerror=alert(1)>'),
        );
        assert.ok(
          textContent(container).includes(
            'Saved attachment is no longer available.',
          ),
        );
        assert.equal(
          window.location.search,
          `?versionId=${oldReportVersionId}`,
        );
      });

      assert.equal(container.querySelector('img'), null);
      assert.ok(
        container.querySelector('.report-builder-preview-warnings.no-print'),
      );
      assert.ok(
        Array.from(container.querySelectorAll('button')).some(
          button => button.textContent?.trim() === 'Generate PDF',
        ),
        'Expected final saved versions to support PDF generation',
      );
      assert.ok(
        calls.includes(
          `/api/reports/${reportDetailsReportId}/versions/${oldReportVersionId}`,
        ),
      );
      assert.equal(
        calls.includes(`/api/reports/${reportDetailsReportId}/versions`),
        false,
      );

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    setupReportDetailsFetchFixture({ emptyVersions: true });

    try {
      const { container, root } = await renderApp(
        routes.reportDetails(reportDetailsCompanyId, reportDetailsReportId),
      );

      await waitFor(() => {
        assert.ok(textContent(container).includes('Report version not found'));
        assert.ok(textContent(container).includes('Return to reports'));
        assert.equal(
          Array.from(container.querySelectorAll('button')).some(
            button => button.textContent?.trim() === 'Generate PDF',
          ),
          false,
        );
      });

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    setupReportDetailsFetchFixture({ failVersions: true });

    try {
      const { container, root } = await renderApp(
        routes.reportDetails(reportDetailsCompanyId, reportDetailsReportId),
      );

      await waitFor(() => {
        assert.ok(textContent(container).includes('Something went wrong'));
        assert.equal(
          textContent(container).includes('Unexpected server error'),
          false,
        );
      });

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    setupReportDetailsFetchFixture();

    try {
      const { container, root } = await renderApp(
        routes.reportDetails(reportDetailsCompanyId, missingReportId),
      );

      await waitFor(() => {
        assert.ok(textContent(container).includes('Report not found'));
        assert.ok(textContent(container).includes('Return to reports'));
        assert.equal(
          window.location.pathname,
          routes.reportDetails(reportDetailsCompanyId, missingReportId),
        );
      });

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
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

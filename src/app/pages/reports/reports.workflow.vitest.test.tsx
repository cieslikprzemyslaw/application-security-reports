import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import {
  act,
  createJsonResponse,
  renderApp,
  restoreFetch,
  routes,
  setFetch,
  textContent,
  waitFor,
} from '~/app/appRouter.tests/support';

import {
  latestReportVersion,
  missingReportId,
  oldReportVersionId,
  reportDetailsReportId,
  setupReportDetailsFetchFixture,
} from '~/app/appRouter.tests/reportDetailsFixture';

describe('Report workflow through the production router', () => {
  it('loads the latest immutable ReportVersion and preserves Preview/Data state', async () => {
    const calls = setupReportDetailsFetchFixture();

    try {
      const { container, root } = await renderApp(
        routes.reportDetails(reportDetailsReportId),
      );

      await waitFor(() => {
        assert.ok(textContent(container).includes('Report Preview'));
        assert.ok(textContent(container).includes('Current Customer Portal'));
        assert.ok(textContent(container).includes('v1.1'));
      });

      assert.ok(
        calls.includes(`/api/reports/${reportDetailsReportId}/versions`),
      );

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
        assert.ok(textContent(container).includes(latestReportVersion.id));
        assert.ok(
          textContent(container).includes(
            `"version": ${latestReportVersion.version}`,
          ),
        );
      });

      const previewButton = Array.from(
        container.querySelectorAll('button'),
      ).find(button => button.textContent?.trim() === 'Preview');

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
        assert.ok(textContent(container).includes('Current Customer Portal'));
        assert.ok(textContent(container).includes('Executive Summary'));
      });

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  });

  it('renders an explicitly selected historical version from its saved snapshot', async () => {
    const calls = setupReportDetailsFetchFixture();

    try {
      const { container, root } = await renderApp(
        routes.reportDetailsVersion(reportDetailsReportId, oldReportVersionId),
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
      });

      assert.equal(container.querySelector('img'), null);
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

  it('loads the company report builder tree through the production route', async () => {
    setFetch(async input => {
      const path = String(input);

      if (path === '/api/companies') {
        return createJsonResponse({
          data: [
            {
              id: 'cmp_00000000-0000-0000-0000-000000000001',
              name: 'Northstar Digital',
              website: 'https://northstar.example',
              contactEmail: 'security@northstar.example',
              assessmentCount: 1,
              createdAt: '2026-06-01T00:00:00.000Z',
              updatedAt: '2026-06-10T00:00:00.000Z',
            },
          ],
        });
      }

      if (
        path ===
        '/api/assessments?companyId=cmp_00000000-0000-0000-0000-000000000001'
      ) {
        return createJsonResponse({
          data: [
            {
              id: 'asm_00000000-0000-0000-0000-000000000001',
              companyId: 'cmp_00000000-0000-0000-0000-000000000001',
              title: 'Customer Services Portal',
              applicationName: 'Customer Services Portal',
              assessmentType: 'Web App',
              status: 'in-progress',
              findingsCount: 1,
              updatedAt: '2026-06-14T10:15:00.000Z',
              description: 'Assessment of the customer portal',
              scope: 'Web application',
            },
          ],
        });
      }

      if (
        path ===
        '/api/threats?assessmentId=asm_00000000-0000-0000-0000-000000000001'
      ) {
        return createJsonResponse({
          data: [
            {
              id: 'thr_00000000-0000-0000-0000-000000000001',
              assessmentId: 'asm_00000000-0000-0000-0000-000000000001',
              title: 'Missing Server-Side Authorization',
              description:
                'Authorization is missing on the order lookup endpoint.',
              severity: 'critical',
              strideCategories: ['elevation-of-privilege'],
              status: 'open',
              createdAt: '2026-06-03T00:00:00.000Z',
              updatedAt: '2026-06-12T00:00:00.000Z',
            },
          ],
        });
      }

      if (
        path ===
        '/api/evidence?assessmentId=asm_00000000-0000-0000-0000-000000000001'
      ) {
        return createJsonResponse({
          data: [
            {
              id: 'evd_00000000-0000-0000-0000-000000000001',
              assessmentId: 'asm_00000000-0000-0000-0000-000000000001',
              threatIds: ['thr_00000000-0000-0000-0000-000000000001'],
              type: 'text',
              title: 'Authorization note',
              createdAt: '2026-06-05T00:00:00.000Z',
              updatedAt: '2026-06-05T00:00:00.000Z',
            },
          ],
        });
      }

      throw new Error(`Unexpected request: ${path}`);
    });

    try {
      const { container, root } = await renderApp(
        routes.companyWorkspaceReports(
          'cmp_00000000-0000-0000-0000-000000000001',
        ),
      );

      await waitFor(() => {
        assert.ok(textContent(container).includes('Report Preview'));
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
        assert.ok(textContent(container).includes('Selection tree'));
        assert.ok(textContent(container).includes('Northstar Digital'));
        assert.ok(
          textContent(container).includes('Missing Server-Side Authorization'),
        );
      });

      const assessmentCheckbox = Array.from(
        container.querySelectorAll('input[type="checkbox"]'),
      ).find(input =>
        input
          .getAttribute('id')
          ?.includes('assessment-asm_00000000-0000-0000-0000-000000000001'),
      ) as HTMLInputElement | undefined;

      const threatCheckbox = Array.from(
        container.querySelectorAll('input[type="checkbox"]'),
      ).find(input =>
        input
          .getAttribute('id')
          ?.includes('threat-thr_00000000-0000-0000-0000-000000000001'),
      ) as HTMLInputElement | undefined;

      const evidenceCheckbox = Array.from(
        container.querySelectorAll('input[type="checkbox"]'),
      ).find(input =>
        input
          .getAttribute('id')
          ?.includes('evidence-evd_00000000-0000-0000-0000-000000000001'),
      ) as HTMLInputElement | undefined;
      const includeEvidenceCheckbox = container.querySelector(
        '#report-builder-include-evidence',
      ) as HTMLInputElement | null;

      assert.ok(
        includeEvidenceCheckbox,
        'Expected the include Evidence checkbox',
      );
      assert.ok(assessmentCheckbox, 'Expected the assessment checkbox');
      assert.ok(threatCheckbox, 'Expected the threat checkbox');
      assert.ok(evidenceCheckbox, 'Expected the evidence checkbox');

      assert.equal(includeEvidenceCheckbox?.checked, false);
      assert.equal(evidenceCheckbox?.checked, false);

      await act(async () => {
        includeEvidenceCheckbox!.click();
      });

      await waitFor(() => {
        assert.equal(includeEvidenceCheckbox?.checked, true);
        assert.equal(evidenceCheckbox?.checked, false);
      });

      await act(async () => {
        assessmentCheckbox!.click();
      });

      await waitFor(() => {
        assert.equal(assessmentCheckbox?.checked, true);
        assert.equal(threatCheckbox?.checked, true);
        assert.equal(threatCheckbox?.indeterminate, false);
        assert.equal(evidenceCheckbox?.checked, true);
      });

      await act(async () => {
        evidenceCheckbox!.click();
      });

      await waitFor(() => {
        assert.equal(assessmentCheckbox?.indeterminate, true);
        assert.equal(threatCheckbox?.checked, false);
        assert.equal(threatCheckbox?.indeterminate, true);
        assert.equal(evidenceCheckbox?.checked, false);
      });

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  });

  it('keeps a missing Report inside the safe route-level failure state', async () => {
    setupReportDetailsFetchFixture();

    try {
      const { container, root } = await renderApp(
        routes.reportDetails(missingReportId),
      );

      await waitFor(() => {
        assert.ok(textContent(container).includes('Report not found'));
        assert.ok(textContent(container).includes('Return to reports'));
        assert.equal(
          window.location.pathname,
          routes.reportDetails(missingReportId),
        );
      });

      assert.equal(textContent(container).includes('Report Preview'), false);

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  });
});

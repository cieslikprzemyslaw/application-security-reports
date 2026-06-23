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

  it('loads the company report builder tree through the production route', async () => {
    setFetch(async input => {
      const path = String(input);

      if (path === '/api/companies') {
        return createJsonResponse({
          data: [
            {
              id: 'cmp_1',
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

      if (path === '/api/assessments?companyId=cmp_1') {
        return createJsonResponse({
          data: [
            {
              id: 'asm_1',
              companyId: 'cmp_1',
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

      if (path === '/api/threats?assessmentId=asm_1') {
        return createJsonResponse({
          data: [
            {
              id: 'thr_1',
              assessmentId: 'asm_1',
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

      if (path === '/api/evidence?assessmentId=asm_1') {
        return createJsonResponse({
          data: [
            {
              id: 'evd_1',
              assessmentId: 'asm_1',
              threatIds: ['thr_1'],
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
        routes.companyWorkspaceReports('cmp_1'),
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

      const assessmentButton = Array.from(
        container.querySelectorAll('button'),
      ).find(
        button =>
          button.textContent?.includes('Customer Services Portal') &&
          button.textContent?.includes('Assessment'),
      );

      const threatButton = Array.from(
        container.querySelectorAll('button'),
      ).find(
        button =>
          button.textContent?.includes('Missing Server-Side Authorization') &&
          button.textContent?.includes('evidence'),
      );

      const evidenceButton = Array.from(
        container.querySelectorAll('button'),
      ).find(button => button.textContent?.includes('Authorization note'));

      assert.ok(assessmentButton, 'Expected the assessment toggle');
      assert.ok(threatButton, 'Expected the threat toggle');
      assert.ok(evidenceButton, 'Expected the evidence toggle');

      await act(async () => {
        assessmentButton!.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
      });

      await waitFor(() => {
        assert.equal(assessmentButton?.getAttribute('aria-pressed'), 'true');
      });

      await act(async () => {
        threatButton!.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
      });

      await act(async () => {
        evidenceButton!.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
      });

      await waitFor(() => {
        assert.equal(threatButton?.getAttribute('aria-pressed'), 'true');
        assert.equal(evidenceButton?.getAttribute('aria-pressed'), 'true');
        assert.equal(assessmentButton?.getAttribute('aria-pressed'), 'true');
      });

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
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

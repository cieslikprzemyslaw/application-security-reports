import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import {
  act,
  createJsonResponse,
  renderApp,
  renderTick,
  restoreFetch,
  routes,
  setFetch,
  textContent,
  waitFor,
} from '~/app/appRouter.tests/support';

import {
  previewAssessmentId,
  previewCompanyId,
  previewEvidenceId,
  previewSnapshot,
  previewThreatId,
} from './reportPreview.testFixtures';

const findButton = (container: HTMLElement, label: string) =>
  Array.from(container.querySelectorAll('button')).find(
    button => button.textContent?.trim() === label,
  );

const findCheckbox = (container: HTMLElement, value: string) =>
  Array.from(container.querySelectorAll('input[type="checkbox"]')).find(input =>
    input.getAttribute('id')?.includes(value),
  ) as HTMLInputElement | undefined;

const installReportBuilderFetchFixture = (reportRequests: RequestInit[]) => {
  setFetch(async (input, init = {}) => {
    const path = String(input);

    if (path === '/api/companies') {
      return createJsonResponse({
        data: [
          {
            id: previewCompanyId,
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

    if (path === `/api/assessments?companyId=${previewCompanyId}`) {
      return createJsonResponse({
        data: [
          {
            id: previewAssessmentId,
            companyId: previewCompanyId,
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

    if (path === `/api/threats?assessmentId=${previewAssessmentId}`) {
      return createJsonResponse({
        data: [
          {
            id: previewThreatId,
            assessmentId: previewAssessmentId,
            title: 'Missing Server-Side Authorization',
            description: 'Authorization is missing.',
            severity: 'critical',
            strideCategories: ['elevation-of-privilege'],
            status: 'open',
            createdAt: '2026-06-03T00:00:00.000Z',
            updatedAt: '2026-06-12T00:00:00.000Z',
          },
        ],
      });
    }

    if (path === `/api/evidence?assessmentId=${previewAssessmentId}`) {
      return createJsonResponse({
        data: [
          {
            id: previewEvidenceId,
            assessmentId: previewAssessmentId,
            threatIds: [previewThreatId],
            type: 'note',
            title: 'Authorization evidence',
            createdAt: '2026-06-05T00:00:00.000Z',
            updatedAt: '2026-06-05T00:00:00.000Z',
          },
        ],
      });
    }

    if (path.startsWith('/api/reports')) {
      reportRequests.push({ ...init, headers: init.headers, body: init.body });

      if (path !== '/api/reports/preview') {
        throw new Error(`Unexpected Report mutation request: ${path}`);
      }

      return createJsonResponse({ data: previewSnapshot });
    }

    throw new Error(`Unexpected request: ${path}`);
  });
};

describe('Report Builder preview navigation state', () => {
  it('uses Generate preview and Back to editor without saving a version or losing state', async () => {
    const reportRequests: RequestInit[] = [];
    installReportBuilderFetchFixture(reportRequests);

    try {
      const editorPath = routes.companyWorkspaceReports(previewCompanyId);
      const previewPath =
        routes.companyWorkspaceReportsPreview(previewCompanyId);
      const { container, root } = await renderApp(editorPath);

      await waitFor(() => {
        assert.ok(textContent(container).includes('Selection tree'));
      });

      const includeEvidenceCheckbox = container.querySelector(
        '#report-builder-include-evidence',
      ) as HTMLInputElement | null;
      const assessmentCheckbox = findCheckbox(
        container,
        `assessment-${previewAssessmentId}`,
      );

      assert.ok(includeEvidenceCheckbox);
      assert.ok(assessmentCheckbox);

      await act(async () => {
        includeEvidenceCheckbox.click();
        assessmentCheckbox.click();
      });

      await waitFor(() => {
        assert.ok(reportRequests.length > 0);
      });

      await waitFor(() => {
        const generatePreviewButton = findButton(
          container,
          'Generate preview',
        ) as HTMLButtonElement | undefined;

        assert.ok(generatePreviewButton);
        assert.equal(generatePreviewButton.disabled, false);
      });

      const generatePreviewButton = findButton(
        container,
        'Generate preview',
      ) as HTMLButtonElement | undefined;

      assert.ok(generatePreviewButton);

      await act(async () => {
        generatePreviewButton.click();
        await renderTick();
        await renderTick();
      });

      await waitFor(() => {
        assert.equal(window.location.pathname, previewPath);
        assert.ok(
          textContent(container).includes('Missing Server-Side Authorization'),
        );
      });

      const expectedRouteState = {
        companyId: previewCompanyId,
        selection: {
          selectedAssessmentId: previewAssessmentId,
          selectedThreatIds: [previewThreatId],
          selectedEvidenceIds: [previewEvidenceId],
        },
        configuration: {
          includeEvidence: true,
        },
      };

      assert.deepEqual(window.history.state.usr, expectedRouteState);
      assert.equal(
        window.document.activeElement?.textContent?.trim(),
        'Report Preview',
      );

      const backToEditorButton = findButton(container, 'Back to editor');
      assert.ok(backToEditorButton);

      await act(async () => {
        backToEditorButton.click();
        await renderTick();
        await renderTick();
      });

      await waitFor(() => {
        assert.equal(window.location.pathname, editorPath);
        assert.ok(textContent(container).includes('Selection tree'));
      });

      const restoredIncludeEvidenceCheckbox = container.querySelector(
        '#report-builder-include-evidence',
      ) as HTMLInputElement | null;
      const restoredAssessmentCheckbox = findCheckbox(
        container,
        `assessment-${previewAssessmentId}`,
      );
      const restoredThreatCheckbox = findCheckbox(
        container,
        `threat-${previewThreatId}`,
      );
      const restoredEvidenceCheckbox = findCheckbox(
        container,
        `evidence-${previewEvidenceId}`,
      );

      assert.equal(restoredIncludeEvidenceCheckbox?.checked, true);
      assert.equal(restoredAssessmentCheckbox?.checked, true);
      assert.equal(restoredThreatCheckbox?.checked, true);
      assert.equal(restoredEvidenceCheckbox?.checked, true);
      assert.deepEqual(window.history.state.usr, expectedRouteState);
      assert.equal(
        window.document.activeElement?.textContent?.trim(),
        'Preview',
      );

      await act(async () => {
        window.history.forward();
        await renderTick();
        await renderTick();
      });

      await waitFor(() => {
        assert.equal(window.location.pathname, previewPath);
        assert.ok(
          textContent(container).includes('Missing Server-Side Authorization'),
        );
      });

      assert.equal(
        window.document.activeElement?.textContent?.trim(),
        'Report Preview',
      );
      assert.ok(reportRequests.length > 0);
      assert.ok(
        reportRequests.every(request => request.method === 'POST'),
        'Preview navigation must not create or update a ReportVersion.',
      );

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  });

  it('redirects a direct preview navigation without valid route state to the editor', async () => {
    const reportRequests: RequestInit[] = [];
    installReportBuilderFetchFixture(reportRequests);

    try {
      const editorPath = routes.companyWorkspaceReports(previewCompanyId);
      const { container, root } = await renderApp(
        routes.companyWorkspaceReportsPreview(previewCompanyId),
      );

      await waitFor(() => {
        assert.equal(window.location.pathname, editorPath);
        assert.ok(textContent(container).includes('Selection tree'));
      });

      assert.equal(reportRequests.length, 0);

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  });
});

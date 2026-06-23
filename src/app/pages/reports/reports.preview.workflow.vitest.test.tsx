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

describe('Report Builder preview through the production route', () => {
  it('sends exact builder state, renders validated data, and preserves state after failure', async () => {
    const previewBodies: unknown[] = [];

    setFetch(async (input, init) => {
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

      if (path === '/api/reports/preview') {
        previewBodies.push(JSON.parse(String(init?.body)));

        if (previewBodies.length === 1) {
          return createJsonResponse({ data: previewSnapshot });
        }

        return createJsonResponse(
          {
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Unexpected server error',
            },
          },
          { status: 500 },
        );
      }

      throw new Error(`Unexpected request: ${path}`);
    });

    try {
      const { container, root } = await renderApp(
        routes.companyWorkspaceReports(previewCompanyId),
      );

      await waitFor(() => {
        assert.ok(textContent(container).includes('Select an assessment'));
        assert.equal(textContent(container).includes('✓ Auto-saved'), false);
      });

      await act(async () => {
        findButton(container, 'Data')?.click();
      });

      await waitFor(() => {
        assert.ok(textContent(container).includes('Selection tree'));
      });

      const includeEvidenceCheckbox = container.querySelector(
        '#report-builder-include-evidence',
      ) as HTMLInputElement;
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
        assert.equal(previewBodies.length, 1);
      });

      assert.deepEqual(previewBodies[0], {
        companyId: previewCompanyId,
        assessmentId: previewAssessmentId,
        selection: {
          threatIds: [previewThreatId],
          evidenceIds: [previewEvidenceId],
        },
        configuration: {
          includeEvidence: true,
        },
        brandingMode: 'issuer',
      });

      await act(async () => {
        findButton(container, 'Preview')?.click();
      });

      await waitFor(() => {
        assert.ok(
          textContent(container).includes('Missing Server-Side Authorization'),
        );
        assert.ok(
          textContent(container).includes(
            'The request returned another user’s order.',
          ),
        );
      });

      await act(async () => {
        findButton(container, 'Data')?.click();
      });

      const refreshedIncludeEvidenceCheckbox = container.querySelector(
        '#report-builder-include-evidence',
      ) as HTMLInputElement;

      await act(async () => {
        refreshedIncludeEvidenceCheckbox.click();
      });

      await waitFor(() => {
        assert.equal(previewBodies.length, 2);
      });

      await act(async () => {
        findButton(container, 'Preview')?.click();
      });

      await waitFor(() => {
        assert.ok(textContent(container).includes('Preview refresh failed'));
        assert.ok(
          textContent(container).includes('Missing Server-Side Authorization'),
        );
      });

      await act(async () => {
        findButton(container, 'Data')?.click();
      });

      assert.equal(refreshedIncludeEvidenceCheckbox.checked, false);
      assert.equal(assessmentCheckbox.checked, true);

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  });
});

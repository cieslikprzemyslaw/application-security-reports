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

const siblingThreatId = 'thr_00000000-0000-0000-0000-000000000099';
const siblingEvidenceId = 'evd_00000000-0000-0000-0000-000000000099';

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
            {
              id: siblingThreatId,
              assessmentId: previewAssessmentId,
              title: 'Verbose Error Messages',
              description: 'Unhandled errors disclose stack traces.',
              severity: 'medium',
              strideCategories: ['information-disclosure'],
              status: 'open',
              createdAt: '2026-06-04T00:00:00.000Z',
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
            {
              id: siblingEvidenceId,
              assessmentId: previewAssessmentId,
              threatIds: [siblingThreatId],
              type: 'note',
              title: 'Error disclosure evidence',
              createdAt: '2026-06-06T00:00:00.000Z',
              updatedAt: '2026-06-06T00:00:00.000Z',
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
        assert.ok(textContent(container).includes('Selection tree'));
        assert.equal(textContent(container).includes('✓ Auto-saved'), false);
      });

      const includeEvidenceCheckbox = container.querySelector(
        '#report-builder-include-evidence',
      ) as HTMLInputElement;
      const assessmentCheckbox = findCheckbox(
        container,
        `assessment-${previewAssessmentId}`,
      );
      const threatCheckbox = findCheckbox(
        container,
        `threat-${previewThreatId}`,
      );
      const siblingThreatCheckbox = findCheckbox(
        container,
        `threat-${siblingThreatId}`,
      );

      assert.ok(includeEvidenceCheckbox);
      assert.ok(assessmentCheckbox);
      assert.ok(threatCheckbox);
      assert.ok(siblingThreatCheckbox);

      await act(async () => {
        includeEvidenceCheckbox.click();
        threatCheckbox.click();
      });

      await waitFor(() => {
        assert.equal(previewBodies.length, 1);
        assert.equal(assessmentCheckbox.indeterminate, true);
        assert.equal(threatCheckbox.checked, true);
        assert.equal(siblingThreatCheckbox.checked, false);
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

      await waitFor(() => {
        assert.ok(textContent(container).includes('Selection tree'));
      });

      const refreshedIncludeEvidenceCheckbox = container.querySelector(
        '#report-builder-include-evidence',
      ) as HTMLInputElement | null;

      assert.ok(refreshedIncludeEvidenceCheckbox);

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

      await waitFor(() => {
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
      const restoredSiblingThreatCheckbox = findCheckbox(
        container,
        `threat-${siblingThreatId}`,
      );

      assert.equal(restoredIncludeEvidenceCheckbox?.checked, false);
      assert.equal(restoredAssessmentCheckbox?.checked, false);
      assert.equal(restoredAssessmentCheckbox?.indeterminate, true);
      assert.equal(restoredThreatCheckbox?.checked, true);
      assert.equal(restoredSiblingThreatCheckbox?.checked, false);

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  });
});

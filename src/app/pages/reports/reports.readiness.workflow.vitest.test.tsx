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
  previewSnapshot,
  previewThreatId,
} from './reportPreview.testFixtures';

const reportId = 'rpt_00000000-0000-0000-0000-000000000232';

const findButton = (container: HTMLElement, label: string) =>
  Array.from(container.querySelectorAll('button')).find(
    button => button.textContent?.trim() === label,
  ) as HTMLButtonElement | undefined;

const findCheckbox = (container: HTMLElement, value: string) =>
  Array.from(container.querySelectorAll('input[type="checkbox"]')).find(input =>
    input.getAttribute('id')?.includes(value),
  ) as HTMLInputElement | undefined;

describe('Report readiness through the production Report Builder route', () => {
  it('renders backend blockers and warnings, blocks Final, keeps Draft, and focuses the returned target', async () => {
    const reportBodies: unknown[] = [];
    const readinessBodies: unknown[] = [];
    let createdReportListItem: Record<string, unknown> | undefined;

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

      if (
        path ===
        `/api/companies/${previewCompanyId}/assessments/${previewAssessmentId}/overview`
      ) {
        return createJsonResponse({
          data: {
            company: {
              id: previewCompanyId,
              name: 'Northstar Digital',
            },
            assessment: {
              id: previewAssessmentId,
              companyId: previewCompanyId,
              title: 'Customer Services Portal',
              status: 'in-progress',
              applicationName: 'Customer Services Portal',
              environment: 'Production',
              assessmentType: 'Web App',
              overallRisk: 'high',
              owaspTaxonomyVersion: '2025',
              createdAt: '2026-06-01T00:00:00.000Z',
              updatedAt: '2026-06-12T00:00:00.000Z',
              recordVersion: 1,
              findingsCount: 1,
              evidenceCount: 0,
              reportVersionCount: 0,
              testerName: 'Alex Mercer',
              availableActions: ['complete', 'archive'],
            },
          },
        });
      }

      if (path === `/api/threats?assessmentId=${previewAssessmentId}`) {
        return createJsonResponse({
          data: [
            {
              id: previewThreatId,
              assessmentId: previewAssessmentId,
              title: 'Missing Server-Side Authorization',
              description: '',
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
          data: createdReportListItem ? [createdReportListItem] : [],
        });
      }

      if (path === `/api/reports?assessmentId=${previewAssessmentId}`) {
        return createJsonResponse({
          data: createdReportListItem ? [createdReportListItem] : [],
        });
      }

      if (path === '/api/reports/preview') {
        return createJsonResponse({
          data: {
            ...previewSnapshot,
            selection: {
              threatIds: [previewThreatId],
              evidenceIds: [],
            },
            configuration: {
              includeEvidence: true,
            },
            selectedThreats: [
              {
                ...previewSnapshot.selectedThreats[0]!,
                description: '',
              },
            ],
            selectedEvidence: [],
            riskSummary: {
              ...previewSnapshot.riskSummary,
              evidenceCount: 0,
            },
          },
        });
      }

      if (path === '/api/reports' && init?.method === 'POST') {
        reportBodies.push(JSON.parse(String(init.body)));

        const createdReport = {
          id: reportId,
          assessmentId: previewAssessmentId,
          title: 'Customer Services Portal Security Report',
          status: 'draft',
          selectedThreatIds: [previewThreatId],
          latestVersion: 0,
          createdAt: '2026-06-26T10:00:00.000Z',
          updatedAt: '2026-06-26T10:00:00.000Z',
        };
        createdReportListItem = {
          ...createdReport,
          versions: [],
        };

        return createJsonResponse(
          {
            data: createdReport,
          },
          { status: 201 },
        );
      }

      if (
        path === `/api/reports/${reportId}/readiness` &&
        init?.method === 'POST'
      ) {
        readinessBodies.push(JSON.parse(String(init.body)));

        return createJsonResponse({
          data: {
            errors: [
              {
                code: 'THREAT_DESCRIPTION_REQUIRED',
                message: 'Threat description is required.',
                target: {
                  resourceType: 'threat',
                  resourceId: previewThreatId,
                  field: 'description',
                },
              },
            ],
            warnings: [
              {
                code: 'EVIDENCE_SELECTION_EMPTY',
                message: 'No Evidence is selected.',
                target: {
                  resourceType: 'report',
                  resourceId: reportId,
                  field: 'selection.evidenceIds',
                },
              },
            ],
          },
        });
      }

      if (path.includes('/versions/final')) {
        throw new Error('Blocked readiness must not create a final version.');
      }

      throw new Error(`Unexpected request: ${path}`);
    });

    try {
      const editorPath = routes.companyWorkspaceReports(previewCompanyId);
      const previewPath =
        routes.companyWorkspaceReportsPreview(previewCompanyId);
      const { container, root } = await renderApp(editorPath);
      const findingsPath = routes.assessmentDetailsFindings(
        previewCompanyId,
        previewAssessmentId,
      );

      await waitFor(() => {
        assert.ok(textContent(container).includes('Selection tree'));
      });

      const threatCheckbox = findCheckbox(
        container,
        `threat-${previewThreatId}`,
      );
      const includeEvidenceCheckbox = container.querySelector(
        '#report-builder-include-evidence',
      ) as HTMLInputElement | null;

      assert.ok(threatCheckbox);
      assert.ok(includeEvidenceCheckbox);

      await act(async () => {
        includeEvidenceCheckbox.click();
        threatCheckbox.click();
      });

      await waitFor(() => {
        const generatePreviewButton = findButton(container, 'Generate preview');

        assert.ok(generatePreviewButton);
        assert.equal(generatePreviewButton.disabled, false);
      });

      await act(async () => {
        findButton(container, 'Generate preview')?.click();
        await renderTick();
        await renderTick();
      });

      await waitFor(() => {
        assert.equal(window.location.pathname, previewPath);
      });

      await act(async () => {
        findButton(container, 'Save as final')?.click();
      });

      await waitFor(() => {
        assert.ok(
          textContent(container).includes('Threat description is required.'),
        );
        assert.ok(textContent(container).includes('No Evidence is selected.'));
      });

      const checklist = container.querySelector('.report-readiness-checklist');
      const finalButton = findButton(container, 'Save as final');
      const draftButton = findButton(container, 'Save draft');

      assert.ok(checklist);
      assert.equal(checklist.getAttribute('data-print-hidden'), 'true');
      assert.equal(checklist.closest('.report-preview-shell-paper'), null);
      assert.ok(finalButton);
      assert.equal(finalButton.disabled, true);
      assert.ok(draftButton);
      assert.equal(draftButton.disabled, false);

      assert.equal(reportBodies.length, 1);
      assert.equal(readinessBodies.length, 1);
      assert.deepEqual(readinessBodies[0], {
        companyId: previewCompanyId,
        assessmentId: previewAssessmentId,
        selection: {
          threatIds: [previewThreatId],
          evidenceIds: [],
        },
        configuration: {
          includeEvidence: true,
        },
        brandingMode: 'issuer',
      });

      const targetButton = Array.from(
        container.querySelectorAll('button'),
      ).find(button =>
        button.textContent?.includes('Threat description is required.'),
      );

      assert.ok(targetButton);

      await act(async () => {
        targetButton.click();
        await renderTick();
        await renderTick();
      });

      await waitFor(() => {
        assert.equal(window.location.pathname, findingsPath);

        const descriptionField = document.getElementById('threat-observation');

        assert.ok(descriptionField);
        assert.equal(document.activeElement, descriptionField);
        assert.ok(document.body.textContent?.includes('Edit threat'));
      });

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  });
});

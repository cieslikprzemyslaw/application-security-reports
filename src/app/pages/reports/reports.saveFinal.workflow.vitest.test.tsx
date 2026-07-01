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
  previewSnapshot,
  previewThreatId,
} from './reportPreview.testFixtures';

const reportId = 'rpt_00000000-0000-0000-0000-000000000198';
const versionId = 'rvs_00000000-0000-0000-0000-000000000198';

const findButton = (container: HTMLElement, label: string) =>
  Array.from(container.querySelectorAll('button')).find(
    button => button.textContent?.trim() === label,
  ) as HTMLButtonElement | undefined;

const findCheckbox = (container: HTMLElement, value: string) =>
  Array.from(container.querySelectorAll('input[type="checkbox"]')).find(input =>
    input.getAttribute('id')?.includes(value),
  ) as HTMLInputElement | undefined;

describe('Save final through the production Report Builder route', () => {
  it('bootstraps once, loads the current version, saves once, and selects the returned final version', async () => {
    const reportBodies: unknown[] = [];
    const readinessBodies: unknown[] = [];
    const finalBodies: unknown[] = [];
    let reportReadCount = 0;
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
              impact: 'Customer data may be exposed.',
              createdAt: '2026-06-03T00:00:00.000Z',
              updatedAt: '2026-06-12T00:00:00.000Z',
            },
          ],
        });
      }

      if (path === `/api/evidence?assessmentId=${previewAssessmentId}`) {
        return createJsonResponse({
          data: [],
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
              includeEvidence: false,
            },
            selectedThreats: [
              {
                ...previewSnapshot.selectedThreats[0]!,
                impact: 'Customer data may be exposed.',
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
          createdAt: '2026-06-26T08:00:00.000Z',
          updatedAt: '2026-06-26T08:00:00.000Z',
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
            errors: [],
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

      if (path === `/api/reports/${reportId}` && init?.method === 'GET') {
        reportReadCount += 1;

        return createJsonResponse({
          data: {
            report: {
              id: reportId,
              assessmentId: previewAssessmentId,
              title: 'Customer Services Portal Security Report',
              status: 'draft',
              selectedThreatIds: [previewThreatId],
              latestVersion: 0,
              createdAt: '2026-06-26T08:00:00.000Z',
              updatedAt: '2026-06-26T08:00:00.000Z',
            },
          },
        });
      }

      if (
        path === `/api/reports/${reportId}/versions/final` &&
        init?.method === 'POST'
      ) {
        finalBodies.push(JSON.parse(String(init.body)));

        return createJsonResponse(
          {
            data: {
              id: versionId,
              reportId,
              version: 10,
              status: 'final',
              generatedAt: '2026-06-26',
              snapshot: {
                ...previewSnapshot,
                reportTitle: 'Customer Services Portal Security Report',
                assessment: {
                  ...previewSnapshot.assessment,
                  applicationName: 'Final Customer Portal',
                },
                selection: {
                  threatIds: [previewThreatId],
                  evidenceIds: [],
                },
                configuration: {
                  includeEvidence: false,
                },
                selectedThreats: [
                  {
                    ...previewSnapshot.selectedThreats[0]!,
                    impact: 'Customer data may be exposed.',
                  },
                ],
                selectedEvidence: [],
                riskSummary: {
                  ...previewSnapshot.riskSummary,
                  evidenceCount: 0,
                },
              },
            },
          },
          { status: 201 },
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
      });

      const threatCheckbox = findCheckbox(
        container,
        `threat-${previewThreatId}`,
      );

      assert.ok(threatCheckbox, 'Expected the Threat checkbox');

      await act(async () => {
        threatCheckbox.click();
      });

      await waitFor(() => {
        const saveButton = findButton(container, 'Save as final');

        assert.ok(saveButton, 'Expected the Save as final button');
        assert.equal(saveButton.disabled, false);
      });

      const saveButton = findButton(container, 'Save as final');

      assert.ok(saveButton);

      await act(async () => {
        saveButton.click();
        saveButton.click();
      });

      await waitFor(() => {
        assert.ok(
          textContent(container).includes('Final version saved as v1.0.'),
        );
        assert.ok(textContent(container).includes('Final Customer Portal'));
        assert.ok(textContent(container).includes(`${reportId} Â· v1.0`));
      });

      assert.equal(reportBodies.length, 1);
      assert.equal(readinessBodies.length, 1);
      assert.equal(reportReadCount, 1);
      assert.equal(finalBodies.length, 1);
      assert.deepEqual(reportBodies[0], {
        assessmentId: previewAssessmentId,
        title: 'Customer Services Portal Security Report',
        selectedThreatIds: [previewThreatId],
      });
      assert.deepEqual(readinessBodies[0], {
        companyId: previewCompanyId,
        assessmentId: previewAssessmentId,
        selection: {
          threatIds: [previewThreatId],
          evidenceIds: [],
        },
        configuration: {
          includeEvidence: false,
        },
        brandingMode: 'issuer',
      });
      assert.deepEqual(finalBodies[0], {
        companyId: previewCompanyId,
        assessmentId: previewAssessmentId,
        selection: {
          threatIds: [previewThreatId],
          evidenceIds: [],
        },
        configuration: {
          includeEvidence: false,
        },
        brandingMode: 'issuer',
        expectedLatestVersion: 0,
      });
      assert.deepEqual(window.history.state.usr, {
        companyId: previewCompanyId,
        reportId,
        selection: {
          selectedAssessmentId: previewAssessmentId,
          selectedThreatIds: [previewThreatId],
        },
      });

      await act(async () => {
        findButton(container, 'Data')?.click();
      });

      await waitFor(() => {
        const restoredThreatCheckbox = findCheckbox(
          container,
          `threat-${previewThreatId}`,
        );

        assert.equal(restoredThreatCheckbox?.checked, true);
      });

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  });
});

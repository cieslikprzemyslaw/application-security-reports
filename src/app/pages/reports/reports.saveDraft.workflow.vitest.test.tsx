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

const reportId = 'rpt_00000000-0000-0000-0000-000000000197';
const versionId = 'rvs_00000000-0000-0000-0000-000000000197';

const findButton = (container: HTMLElement, label: string) =>
  Array.from(container.querySelectorAll('button')).find(
    button => button.textContent?.trim() === label,
  ) as HTMLButtonElement | undefined;

const findCheckbox = (container: HTMLElement, value: string) =>
  Array.from(container.querySelectorAll('input[type="checkbox"]')).find(input =>
    input.getAttribute('id')?.includes(value),
  ) as HTMLInputElement | undefined;

describe('Save draft through the production Report Builder route', () => {
  it('bootstraps once, saves once, selects the returned version, and preserves builder state', async () => {
    const reportBodies: unknown[] = [];
    const draftBodies: unknown[] = [];
    const originalPrint = window.print;
    let printCalls = 0;
    let documentTitleAtPrint = '';

    Object.defineProperty(window, 'print', {
      configurable: true,
      value: () => {
        printCalls += 1;
        documentTitleAtPrint = document.title;
      },
    });

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
          data: [],
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

        return createJsonResponse(
          {
            data: {
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
          { status: 201 },
        );
      }

      if (
        path === `/api/reports/${reportId}/versions/draft` &&
        init?.method === 'POST'
      ) {
        draftBodies.push(JSON.parse(String(init.body)));

        return createJsonResponse(
          {
            data: {
              id: versionId,
              reportId,
              version: 1,
              status: 'draft',
              generatedAt: '2026-06-26',
              snapshot: {
                ...previewSnapshot,
                reportTitle: 'Customer Services Portal Security Report',
                assessment: {
                  ...previewSnapshot.assessment,
                  applicationName: 'Saved Customer Portal',
                },
                selection: {
                  threatIds: [previewThreatId],
                  evidenceIds: [],
                },
                configuration: {
                  includeEvidence: false,
                },
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
        const saveButton = findButton(container, 'Save draft');

        assert.ok(saveButton, 'Expected the Save draft button');
        assert.equal(saveButton.disabled, false);
      });

      const saveButton = findButton(container, 'Save draft');

      assert.ok(saveButton);

      await act(async () => {
        saveButton.click();
        saveButton.click();
      });

      await waitFor(() => {
        assert.ok(textContent(container).includes('Draft saved as v0.1.'));
        assert.ok(textContent(container).includes('Saved Customer Portal'));
        assert.ok(textContent(container).includes(`${reportId} · v0.1`));
      });

      assert.equal(reportBodies.length, 1);
      assert.equal(draftBodies.length, 1);
      assert.deepEqual(reportBodies[0], {
        assessmentId: previewAssessmentId,
        title: 'Customer Services Portal Security Report',
        selectedThreatIds: [previewThreatId],
      });
      assert.deepEqual(draftBodies[0], {
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
      assert.deepEqual(window.history.state.usr, {
        companyId: previewCompanyId,
        reportId,
        selection: {
          selectedAssessmentId: previewAssessmentId,
          selectedThreatIds: [previewThreatId],
        },
      });

      const generatePdfButton = findButton(container, 'Generate PDF');

      assert.ok(generatePdfButton, 'Expected the Generate PDF action');
      assert.equal(generatePdfButton.disabled, false);
      assert.equal(findButton(container, 'Print'), undefined);

      await act(async () => {
        generatePdfButton.click();
      });

      assert.equal(printCalls, 1);
      assert.equal(
        documentTitleAtPrint,
        'Northstar Digital - Customer Services Portal Security Report - v0.1',
      );
      assert.equal(reportBodies.length, 1);
      assert.equal(draftBodies.length, 1);

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
      Object.defineProperty(window, 'print', {
        configurable: true,
        value: originalPrint,
      });
      restoreFetch();
    }
  });
});

import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { previewSnapshot } from '~/app/pages/reports/reportPreview.testFixtures';
import { routes } from '~/routes';
import { act, waitFor } from '~/test/vitestLegacyBridge';

import {
  companyResponse,
  createAssessmentOverviewResponse,
  createJsonResponse,
  renderApp,
  restoreFetch,
  setFetch,
  textContent,
} from './assessmentDetails.router.testUtils';

const reportId = 'rpt_00000000-0000-0000-0000-000000000001';
const versionId = 'rvs_00000000-0000-0000-0000-000000000001';

const savedVersionSnapshot = {
  ...previewSnapshot,
  reportTitle: 'Customer Portal Security Report',
  company: {
    ...previewSnapshot.company,
    id: 'cmp_1',
    name: 'Northwind Labs',
  },
  assessment: {
    ...previewSnapshot.assessment,
    id: 'asm_1',
    companyId: 'cmp_1',
    title: 'Customer Services Portal',
    applicationName: 'Customer Services Portal',
  },
  branding: {
    ...previewSnapshot.branding,
    companyName: 'Northwind Labs',
    companyLogoUrl: null,
  },
};

describe('assessment Reports tab navigation', () => {
  it('opens the selected immutable version preview', async () => {
    const calls: string[] = [];

    try {
      setFetch(async input => {
        const path = String(input);
        calls.push(path);

        if (path === '/api/companies') {
          return createJsonResponse(companyResponse);
        }

        if (path === '/api/companies/cmp_1/assessments/asm_1/overview') {
          return createJsonResponse(
            createAssessmentOverviewResponse('asm_1', 0),
          );
        }

        if (path === '/api/threats?assessmentId=asm_1') {
          return createJsonResponse({ data: [] });
        }

        if (path === '/api/evidence?assessmentId=asm_1') {
          return createJsonResponse({ data: [] });
        }

        if (path === '/api/reports?assessmentId=asm_1') {
          return createJsonResponse({
            data: [
              {
                id: reportId,
                assessmentId: 'asm_1',
                title: 'Customer Portal Security Report',
                status: 'draft',
                selectedThreatIds: [],
                latestVersion: 1,
                createdAt: '2026-06-25T10:00:00.000Z',
                updatedAt: '2026-06-25T11:00:00.000Z',
                versions: [
                  {
                    id: versionId,
                    version: 1,
                    status: 'draft',
                    generatedAt: '2026-06-25',
                  },
                ],
              },
            ],
          });
        }

        if (path === `/api/reports/${reportId}/versions/${versionId}`) {
          return createJsonResponse({
            data: {
              id: versionId,
              reportId,
              version: 1,
              status: 'draft',
              generatedAt: '2026-06-25',
              snapshot: savedVersionSnapshot,
            },
          });
        }

        throw new Error(`Unexpected request: ${path}`);
      });

      const { container, root } = await renderApp(
        routes.assessmentDetailsReports('cmp_1', 'asm_1'),
      );

      await waitFor(() => {
        assert.ok(
          textContent(container).includes('Customer Portal Security Report'),
        );
      });

      const reportLink = Array.from(container.querySelectorAll('a')).find(
        link => link.textContent?.trim() === 'Customer Portal Security Report',
      );

      assert.ok(
        reportLink,
        'Expected the report title to link to its latest version',
      );

      await act(async () => {
        reportLink.click();
        await new Promise<void>(resolve => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        assert.equal(
          window.location.pathname,
          routes.reportDetails('cmp_1', reportId),
        );
        assert.equal(window.location.search, `?versionId=${versionId}`);
        assert.ok(textContent(container).includes('Report Preview'));
        assert.ok(textContent(container).includes('v0.1'));
      });

      assert.ok(
        calls.includes(`/api/reports/${reportId}/versions/${versionId}`),
      );

      root.unmount();
    } finally {
      restoreFetch();
    }
  });
});

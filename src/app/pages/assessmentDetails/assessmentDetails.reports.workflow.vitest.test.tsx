import { describe, it } from 'vitest';

import assert from 'node:assert/strict';

import { waitFor } from '~/test/vitestLegacyBridge';
import { routes } from '~/routes';

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

describe('assessment Reports tab workflow', () => {
  it('shows reports and links every saved version to Report Details', async () => {
    try {
      setFetch(async input => {
        const path = String(input);

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

        throw new Error(`Unexpected request: ${path}`);
      });

      const { container, root } = await renderApp(
        routes.assessmentDetailsReports('cmp_1', 'asm_1'),
      );

      await waitFor(() => {
        assert.ok(
          textContent(container).includes('Customer Portal Security Report'),
        );
        assert.ok(textContent(container).includes('Open v0.1'));
      });

      const versionLink = Array.from(container.querySelectorAll('a')).find(
        link => link.textContent?.includes('Open v0.1'),
      );

      assert.equal(
        versionLink?.getAttribute('href'),
        routes.reportDetailsVersion('cmp_1', reportId, versionId),
      );

      root.unmount();
    } finally {
      restoreFetch();
    }
  });
});

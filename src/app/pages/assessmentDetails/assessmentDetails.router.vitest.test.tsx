import { describe, it } from 'vitest';

import assert from 'node:assert/strict';

import { act, waitFor } from '~/test/vitestLegacyBridge';

import { routes } from '~/routes';
import {
  companyResponse,
  createAssessmentOverviewResponse,
  createEvidenceResponse,
  createJsonResponse,
  renderApp,
  renderTick,
  restoreFetch,
  setFetch,
  textContent,
} from './assessmentDetails.router.testUtils';

describe('assessmentDetails.router', () => {
  it('passes the migrated checks', async () => {
    await (async () => {
      try {
        {
          setFetch(async input => {
            const path = String(input);

            if (path === '/api/companies') {
              return createJsonResponse(companyResponse);
            }

            if (path === '/api/companies/cmp_1/assessments/asm_1/overview') {
              return createJsonResponse(
                createAssessmentOverviewResponse('asm_1', 1),
              );
            }

            if (path === '/api/evidence?assessmentId=asm_1') {
              return createJsonResponse(createEvidenceResponse('evd_1'));
            }

            throw new Error(`Unexpected request: ${path}`);
          });

          const { container, root } = await renderApp(
            routes.assessmentDetailsOverview('cmp_1', 'asm_1'),
          );

          await waitFor(() => {
            assert.ok(
              textContent(container).includes('Customer Services Portal'),
            );
          });

          assert.ok(
            textContent(container).includes('Customer Services Portal'),
          );
          assert.equal(
            textContent(container).includes('asm_1'),
            false,
            'Expected the Assessment ID to stay hidden from the UI',
          );
          assert.ok(textContent(container).includes('Evidence'));
          assert.equal(
            container
              .querySelector(
                '.assessment-summary-metadata-item:nth-child(1) .assessment-summary-metadata-value',
              )
              ?.textContent?.trim(),
            'Production',
          );
          assert.equal(
            container
              .querySelector(
                '.assessment-summary-metadata-item:nth-child(3) .assessment-summary-metadata-value',
              )
              ?.textContent?.trim(),
            'Alex Mercer',
          );

          const evidenceTab = Array.from(
            container.querySelectorAll('[role="tab"]'),
          ).find(button => button.textContent?.startsWith('Evidence')) as
            | HTMLButtonElement
            | undefined;

          assert.ok(evidenceTab, 'Expected the Evidence tab');

          await act(async () => {
            evidenceTab!.click();
            await renderTick();
            await renderTick();
          });

          await waitFor(() => {
            assert.ok(textContent(container).includes('Evidence screenshot'));
          });

          await act(async () => {
            root.unmount();
          });
        }

        {
          setFetch(async input => {
            const path = String(input);

            if (path === '/api/companies') {
              return createJsonResponse(companyResponse);
            }

            if (path === '/api/companies/cmp_1/assessments/asm_null/overview') {
              return createJsonResponse(
                createAssessmentOverviewResponse('asm_null', 1, null, {
                  environment: null,
                  testerName: null,
                }),
              );
            }

            if (path === '/api/evidence?assessmentId=asm_null') {
              return createJsonResponse(createEvidenceResponse('evd_null'));
            }

            throw new Error(`Unexpected request: ${path}`);
          });

          const { container, root } = await renderApp(
            routes.assessmentDetailsOverview('cmp_1', 'asm_null'),
          );

          await waitFor(() => {
            assert.ok(
              container.querySelector('.assessment-summary-application-name'),
            );
          });

          assert.equal(
            container
              .querySelector('.assessment-summary-application-name')
              ?.textContent?.trim(),
            '—',
          );
          assert.equal(
            container
              .querySelector(
                '.assessment-summary-metadata-item:nth-child(1) .assessment-summary-metadata-value',
              )
              ?.textContent?.trim(),
            '—',
          );
          assert.equal(
            container
              .querySelector(
                '.assessment-summary-metadata-item:nth-child(3) .assessment-summary-metadata-value',
              )
              ?.textContent?.trim(),
            '—',
          );

          await act(async () => {
            root.unmount();
          });
        }

        {
          setFetch(async input => {
            const path = String(input);

            if (path === '/api/companies') {
              return createJsonResponse(companyResponse);
            }

            if (
              path === '/api/companies/cmp_1/assessments/asm_empty/overview'
            ) {
              return createJsonResponse(
                createAssessmentOverviewResponse('asm_empty', 0),
              );
            }

            if (path === '/api/evidence?assessmentId=asm_empty') {
              return createJsonResponse({ data: [] });
            }

            throw new Error(`Unexpected request: ${path}`);
          });

          const { container, root } = await renderApp(
            routes.assessmentDetailsOverview('cmp_1', 'asm_empty'),
          );

          await waitFor(() => {
            assert.ok(
              textContent(container).includes('Customer Services Portal'),
            );
          });

          assert.ok(
            textContent(container).includes('Customer Services Portal'),
          );
          assert.ok(textContent(container).includes('Evidence'));

          const evidenceTab = Array.from(
            container.querySelectorAll('[role="tab"]'),
          ).find(button => button.textContent?.startsWith('Evidence')) as
            | HTMLButtonElement
            | undefined;

          assert.ok(evidenceTab, 'Expected the Evidence tab');

          await act(async () => {
            evidenceTab!.click();
            await renderTick();
            await renderTick();
          });

          await waitFor(() => {
            assert.ok(textContent(container).includes('No evidence yet'));
          });

          await act(async () => {
            root.unmount();
          });
        }

        {
          setFetch(async input => {
            const path = String(input);

            if (path === '/api/companies') {
              return createJsonResponse(companyResponse);
            }

            if (
              path === '/api/companies/cmp_1/assessments/asm_error/overview'
            ) {
              return createJsonResponse(
                createAssessmentOverviewResponse('asm_error', 1),
              );
            }

            if (path === '/api/evidence?assessmentId=asm_error') {
              throw new Error('Unable to load evidence.');
            }

            throw new Error(`Unexpected request: ${path}`);
          });

          const { container, root } = await renderApp(
            routes.assessmentDetailsEvidence('cmp_1', 'asm_error'),
          );

          await waitFor(() => {
            assert.ok(
              textContent(container).includes('Unable to load evidence'),
            );
          });

          assert.ok(
            textContent(container).includes('Customer Services Portal'),
          );
          assert.ok(textContent(container).includes('Unable to load evidence'));

          await act(async () => {
            root.unmount();
          });
        }
      } finally {
        restoreFetch();
      }
    })();
  }, 15_000);
});

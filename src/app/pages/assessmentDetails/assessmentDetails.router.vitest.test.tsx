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

const formatExpectedDateOnly = (
  year: number,
  monthIndex: number,
  day: number,
) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, monthIndex, day)));

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
                '.assessment-summary-metadata-item:nth-child(2) .assessment-summary-metadata-value',
              )
              ?.textContent?.trim(),
            `${formatExpectedDateOnly(2026, 5, 1)} to ${formatExpectedDateOnly(2026, 5, 10)}`,
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

  it('updates the workspace state after completion and prevents duplicate requests', async () => {
    try {
      let completeRequestCount = 0;
      let didComplete = false;
      let resolveComplete: ((response: Response) => void) | undefined;
      const completeResponse = new Promise<Response>(resolve => {
        resolveComplete = resolve;
      });

      setFetch(async (input, init) => {
        const path = String(input);

        if (path === '/api/companies') {
          return createJsonResponse(companyResponse);
        }

        if (path === '/api/companies/cmp_1/assessments/asm_complete/overview') {
          return createJsonResponse(
            didComplete
              ? createAssessmentOverviewResponse('asm_complete', 1, undefined, {
                  status: 'completed',
                  completedAt: '2026-06-12T12:00:00.000Z',
                  availableActions: ['reopen', 'archive'],
                  recordVersion: 4,
                })
              : createAssessmentOverviewResponse('asm_complete', 1),
          );
        }

        if (path === '/api/evidence?assessmentId=asm_complete') {
          return createJsonResponse(createEvidenceResponse('evd_complete'));
        }

        if (
          path ===
          '/api/companies/cmp_1/assessments/asm_complete/commands/complete'
        ) {
          completeRequestCount += 1;
          assert.equal(init?.method, 'POST');
          assert.deepEqual(JSON.parse(String(init?.body)), {
            recordVersion: 3,
          });

          return completeResponse;
        }

        throw new Error(`Unexpected request: ${path}`);
      });

      const { container, root } = await renderApp(
        routes.assessmentDetailsOverview('cmp_1', 'asm_complete'),
      );

      await waitFor(() => {
        assert.ok(textContent(container).includes('In Progress'));
      });

      const completeButton = Array.from(
        container.querySelectorAll('button'),
      ).find(button => button.textContent?.trim() === 'Complete') as
        | HTMLButtonElement
        | undefined;

      assert.ok(completeButton, 'Expected Complete action to be available');

      await act(async () => {
        completeButton.click();
        completeButton.click();
        await renderTick();
      });

      assert.equal(completeRequestCount, 1);

      await waitFor(() => {
        const pendingCompleteButton = Array.from(
          container.querySelectorAll('button'),
        ).find(button => button.textContent?.trim() === 'Complete') as
          | HTMLButtonElement
          | undefined;

        assert.equal(pendingCompleteButton?.disabled, true);
      });

      await act(async () => {
        didComplete = true;
        resolveComplete?.(
          createJsonResponse(
            createAssessmentOverviewResponse('asm_complete', 1, undefined, {
              status: 'completed',
              completedAt: '2026-06-12T12:00:00.000Z',
              availableActions: ['reopen', 'archive'],
              recordVersion: 4,
            }),
          ),
        );
        await renderTick();
        await renderTick();
      });

      await waitFor(() => {
        assert.ok(textContent(container).includes('Completed'));
      });

      const completedActionLabels = Array.from(
        container.querySelectorAll('button'),
      ).map(button => button.textContent?.trim());

      assert.equal(completedActionLabels.includes('Complete'), false);
      assert.equal(completedActionLabels.includes('Reopen'), true);

      await act(async () => {
        root.unmount();
      });

      const { container: refreshedContainer, root: refreshedRoot } =
        await renderApp(
          routes.assessmentDetailsOverview('cmp_1', 'asm_complete'),
        );

      await waitFor(() => {
        assert.ok(textContent(refreshedContainer).includes('Completed'));
      });

      await act(async () => {
        refreshedRoot.unmount();
      });
    } finally {
      restoreFetch();
    }
  }, 15_000);

  it('keeps the previous workspace state when completion fails', async () => {
    try {
      setFetch(async (input, init) => {
        const path = String(input);

        if (path === '/api/companies') {
          return createJsonResponse(companyResponse);
        }

        if (path === '/api/companies/cmp_1/assessments/asm_failure/overview') {
          return createJsonResponse(
            createAssessmentOverviewResponse('asm_failure', 1),
          );
        }

        if (path === '/api/evidence?assessmentId=asm_failure') {
          return createJsonResponse(createEvidenceResponse('evd_failure'));
        }

        if (
          path ===
          '/api/companies/cmp_1/assessments/asm_failure/commands/complete'
        ) {
          assert.equal(init?.method, 'POST');

          return createJsonResponse(
            {
              error: {
                code: 'COMPLETE_FAILED',
                message: 'Unable to complete assessment.',
                details: [],
              },
            },
            { status: 500 },
          );
        }

        throw new Error(`Unexpected request: ${path}`);
      });

      const { container, root } = await renderApp(
        routes.assessmentDetailsOverview('cmp_1', 'asm_failure'),
      );

      await waitFor(() => {
        assert.ok(textContent(container).includes('In Progress'));
      });

      const completeButton = Array.from(
        container.querySelectorAll('button'),
      ).find(button => button.textContent?.trim() === 'Complete') as
        | HTMLButtonElement
        | undefined;

      assert.ok(completeButton, 'Expected Complete action to be available');

      await act(async () => {
        completeButton.click();
        await renderTick();
      });

      await waitFor(() => {
        assert.ok(
          textContent(container).includes('Unable to update assessment'),
        );
        assert.ok(
          textContent(container).includes('Unable to complete assessment.'),
        );
      });

      assert.ok(textContent(container).includes('In Progress'));

      const actionLabels = Array.from(container.querySelectorAll('button')).map(
        button => button.textContent?.trim(),
      );

      assert.equal(actionLabels.includes('Complete'), true);
      assert.equal(actionLabels.includes('Reopen'), false);

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }, 15_000);
});

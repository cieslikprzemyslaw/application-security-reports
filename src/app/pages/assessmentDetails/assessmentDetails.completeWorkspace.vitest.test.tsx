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

const findButton = (container: HTMLElement, label: string) =>
  Array.from(container.querySelectorAll('button')).find(
    button => button.textContent?.trim() === label,
  ) as HTMLButtonElement | undefined;

const completedOverview = (assessmentId: string) =>
  createAssessmentOverviewResponse(assessmentId, 1, undefined, {
    status: 'completed',
    completedAt: '2026-06-12T12:00:00.000Z',
    availableActions: ['reopen', 'archive'],
    recordVersion: 4,
  });

describe('assessmentDetails complete workspace refresh', () => {
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
              ? completedOverview('asm_complete')
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

      const completeButton = findButton(container, 'Complete');
      assert.ok(completeButton, 'Expected Complete action to be available');

      await act(async () => {
        completeButton.click();
        completeButton.click();
        await renderTick();
      });

      assert.equal(completeRequestCount, 1);

      await waitFor(() => {
        assert.equal(findButton(container, 'Complete')?.disabled, true);
      });

      await act(async () => {
        didComplete = true;
        resolveComplete?.(
          createJsonResponse(completedOverview('asm_complete')),
        );
        await renderTick();
        await renderTick();
      });

      await waitFor(() => {
        assert.ok(textContent(container).includes('Completed'));
      });

      assert.equal(Boolean(findButton(container, 'Complete')), false);
      assert.equal(Boolean(findButton(container, 'Reopen')), true);

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

      const completeButton = findButton(container, 'Complete');
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
      assert.equal(Boolean(findButton(container, 'Complete')), true);
      assert.equal(Boolean(findButton(container, 'Reopen')), false);

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }, 15_000);
});

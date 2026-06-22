import { describe, it } from 'vitest';

import assert from 'node:assert/strict';

import { act, waitFor } from '~/test/vitestLegacyBridge';

import { routes } from '~/routes';
import { OWASP_TOP_10_CURRENT_VERSION } from '~/domain';
import {
  createJsonResponse,
  renderApp,
  renderTick,
  restoreFetch,
  setFetch,
} from './assessmentDetails.threatForm.testUtils';

const waitForUi = (assertion: () => void) =>
  waitFor(assertion, { timeout: 5_000 });
describe('assessmentDetails.evidenceTabCount.delete', () => {
  it('passes the migrated checks', async () => {
    const makeEvidence = (id: string) => ({
      id,
      assessmentId: 'asm_1',
      threatIds: [],
      type: 'text',
      title: `Evidence ${id}`,
      description: 'A text evidence item.',
      content: 'Some captured content.',
      capturedAt: '2026-06-05',
      createdAt: '2026-06-05T00:00:00.000Z',
      updatedAt: '2026-06-05T00:00:00.000Z',
    });

    const makeOverview = (evidenceCount: number) => ({
      company: { id: 'cmp_1', name: 'Northwind Labs' },
      assessment: {
        id: 'asm_1',
        companyId: 'cmp_1',
        title: 'Customer Services Portal',
        status: 'in-progress',
        applicationName: 'Customer Services Portal',
        environment: 'Production',
        assessmentType: 'Web App',
        overallRisk: 'high',
        owaspTaxonomyVersion: OWASP_TOP_10_CURRENT_VERSION,
        createdAt: '2026-06-01T09:00:00.000Z',
        updatedAt: '2026-06-11T09:00:00.000Z',
        recordVersion: 3,
        findingsCount: 0,
        evidenceCount,
        reportVersionCount: 0,
        testerName: 'Alex Mercer',
        availableActions: ['complete', 'archive'],
      },
    });

    const companiesData = [
      {
        id: 'cmp_1',
        name: 'Northwind Labs',
        website: 'https://northwind.example',
        contactEmail: 'security@northwind.example',
        assessmentCount: 1,
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-10T00:00:00.000Z',
      },
    ];

    const evidenceTabCount = (window: { document: Document }): string | null =>
      window.document.querySelector('#evidence-tab .tabs-tab-count')
        ?.textContent ?? null;

    await (async () => {
      try {
        // Delete success — Evidence tab count decrements
        {
          let evidenceCallCount = 0;

          setFetch(async (input, init) => {
            const path = String(input);

            if (path === '/api/companies') {
              return createJsonResponse({ data: companiesData });
            }

            if (path === '/api/companies/cmp_1/assessments/asm_1/overview') {
              return createJsonResponse({ data: makeOverview(2) });
            }

            if (path === '/api/threats?assessmentId=asm_1') {
              return createJsonResponse({ data: [] });
            }

            if (path === '/api/evidence?assessmentId=asm_1') {
              evidenceCallCount++;
              return createJsonResponse({
                data:
                  evidenceCallCount === 1
                    ? [makeEvidence('evd_1'), makeEvidence('evd_2')]
                    : [makeEvidence('evd_2')],
              });
            }

            if (path === '/api/evidence/evd_1' && init?.method === 'DELETE') {
              return new Response(null, { status: 204 });
            }

            throw new Error(
              `Unexpected request: ${path} ${init?.method ?? 'GET'}`,
            );
          });

          const { root, window } = await renderApp(
            routes.assessmentDetailsEvidence('cmp_1', 'asm_1'),
          );

          await waitForUi(() => {
            assert.equal(
              evidenceTabCount(window),

              '2',

              'Expected initial Evidence tab count 2',
            );
          });

          const firstCard = window.document.querySelector(
            '.assessment-evidence-card-title-button',
          ) as HTMLElement | null;
          assert.ok(firstCard, 'Expected an evidence card title button');

          await act(async () => {
            firstCard!.dispatchEvent(
              new window.MouseEvent('click', {
                bubbles: true,
                cancelable: true,
              }),
            );
            await renderTick();
            await renderTick();
          });

          const deleteButton = Array.from(
            window.document.querySelectorAll('button'),
          ).find(b => b.textContent?.trim() === 'Delete evidence') as
            | HTMLButtonElement
            | undefined;
          assert.ok(
            deleteButton,
            'Expected a Delete evidence button in the drawer',
          );

          await act(async () => {
            deleteButton!.dispatchEvent(
              new window.MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                button: 0,
              }),
            );
            await renderTick();
            await renderTick();
          });

          const deleteConfirmationDialog = Array.from(
            window.document.querySelectorAll<HTMLElement>('[role="dialog"]'),
          ).find(dialog =>
            dialog.textContent?.includes('Delete the current evidence record'),
          );
          const confirmDeleteButton = Array.from(
            deleteConfirmationDialog?.querySelectorAll('button') ?? [],
          ).find(b => b.textContent?.trim() === 'Delete evidence') as
            | HTMLButtonElement
            | undefined;
          assert.ok(
            confirmDeleteButton,
            'Expected a Delete evidence confirmation button in the modal',
          );

          await act(async () => {
            confirmDeleteButton!.dispatchEvent(
              new window.MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                button: 0,
              }),
            );
            await renderTick();
            await renderTick();
          });

          await waitForUi(() => {
            assert.equal(
              evidenceTabCount(window),
              '1',
              'Expected Evidence tab count to decrement to 1 after successful delete',
            );
          });

          await act(async () => {
            root.unmount();
          });
        }

        // Delete failure — Evidence tab count unchanged
        {
          setFetch(async (input, init) => {
            const path = String(input);

            if (path === '/api/companies') {
              return createJsonResponse({ data: companiesData });
            }

            if (path === '/api/companies/cmp_1/assessments/asm_1/overview') {
              return createJsonResponse({ data: makeOverview(2) });
            }

            if (path === '/api/threats?assessmentId=asm_1') {
              return createJsonResponse({ data: [] });
            }

            if (path === '/api/evidence?assessmentId=asm_1') {
              return createJsonResponse({
                data: [makeEvidence('evd_1'), makeEvidence('evd_2')],
              });
            }

            if (path === '/api/evidence/evd_1' && init?.method === 'DELETE') {
              return createJsonResponse(
                { error: { code: 'INTERNAL_ERROR', message: 'Server error' } },
                { status: 500 },
              );
            }

            throw new Error(
              `Unexpected request: ${path} ${init?.method ?? 'GET'}`,
            );
          });

          const { root, window } = await renderApp(
            routes.assessmentDetailsEvidence('cmp_1', 'asm_1'),
          );

          await waitForUi(() => {
            assert.equal(
              evidenceTabCount(window),

              '2',

              'Expected initial Evidence tab count 2',
            );
          });

          const firstCard = window.document.querySelector(
            '.assessment-evidence-card-title-button',
          ) as HTMLElement | null;
          assert.ok(firstCard, 'Expected an evidence card title button');

          await act(async () => {
            firstCard!.dispatchEvent(
              new window.MouseEvent('click', {
                bubbles: true,
                cancelable: true,
              }),
            );
            await renderTick();
            await renderTick();
          });

          const deleteButton = Array.from(
            window.document.querySelectorAll('button'),
          ).find(b => b.textContent?.trim() === 'Delete evidence') as
            | HTMLButtonElement
            | undefined;
          assert.ok(
            deleteButton,
            'Expected a Delete evidence button in the drawer',
          );

          await act(async () => {
            deleteButton!.dispatchEvent(
              new window.MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                button: 0,
              }),
            );
            await renderTick();
            await renderTick();
          });

          const deleteConfirmationDialog = Array.from(
            window.document.querySelectorAll<HTMLElement>('[role="dialog"]'),
          ).find(dialog =>
            dialog.textContent?.includes('Delete the current evidence record'),
          );
          const confirmDeleteButton = Array.from(
            deleteConfirmationDialog?.querySelectorAll('button') ?? [],
          ).find(b => b.textContent?.trim() === 'Delete evidence') as
            | HTMLButtonElement
            | undefined;
          assert.ok(
            confirmDeleteButton,
            'Expected a Delete evidence confirmation button in the modal',
          );

          await act(async () => {
            confirmDeleteButton!.dispatchEvent(
              new window.MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                button: 0,
              }),
            );
            await renderTick();
            await renderTick();
          });

          await waitForUi(() => {
            assert.ok(
              window.document.body.textContent?.includes(
                'Unable to delete evidence',
              ),
              'Expected a safe delete error',
            );
            assert.equal(
              evidenceTabCount(window),
              '2',
              'Expected Evidence tab count to remain 2 after failed delete',
            );
          });

          await act(async () => {
            root.unmount();
          });
        }

        console.log('assessmentDetails.evidenceTabCount delete tests passed');
      } finally {
        restoreFetch();
      }
    })();
  }, 30_000);
});

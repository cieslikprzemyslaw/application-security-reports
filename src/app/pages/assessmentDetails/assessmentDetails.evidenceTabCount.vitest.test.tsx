import { describe, it } from 'vitest';

import assert from 'node:assert/strict';

import { act, waitFor, fireEvent } from '~/test/vitestLegacyBridge';

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
describe('assessmentDetails.evidenceTabCount', () => {
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

    const setTitleInputValue = (
      window: {
        HTMLInputElement: typeof HTMLInputElement;
        Event: typeof Event;
      },
      input: HTMLInputElement,
      value: string,
    ) => {
      fireEvent.change(input, {
        target: { value },
      });
    };

    const evidenceTabCount = (window: { document: Document }): string | null =>
      window.document.querySelector('#evidence-tab .tabs-tab-count')
        ?.textContent ?? null;

    await (async () => {
      try {
        // Create success — Evidence tab count increments
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
                data: evidenceCallCount === 1 ? [] : [makeEvidence('evd_new')],
              });
            }

            if (path === '/api/evidence' && init?.method === 'POST') {
              return createJsonResponse(
                { data: makeEvidence('evd_new') },
                { status: 201 },
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

          const addButton = Array.from(
            window.document.querySelectorAll('button'),
          ).find(b => b.textContent?.trim() === 'Add evidence') as
            | HTMLButtonElement
            | undefined;
          assert.ok(addButton, 'Expected the Add evidence button');

          await act(async () => {
            addButton!.dispatchEvent(
              new window.MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                button: 0,
              }),
            );
            await renderTick();
            await renderTick();
          });

          const titleInput = window.document.querySelector(
            '#evidence-title',
          ) as HTMLInputElement | null;
          assert.ok(titleInput, 'Expected evidence title input');

          await act(async () => {
            setTitleInputValue(window, titleInput!, 'New evidence item');
            await renderTick();
          });

          const createButton = Array.from(
            window.document.querySelectorAll('button'),
          ).find(b => b.textContent?.trim() === 'Create evidence') as
            | HTMLButtonElement
            | undefined;
          assert.ok(createButton, 'Expected the Create evidence submit button');

          await act(async () => {
            createButton!.dispatchEvent(
              new window.MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                button: 0,
              }),
            );
            await renderTick();
            await renderTick();
          });

          assert.equal(
            evidenceTabCount(window),
            '3',
            'Expected Evidence tab count to increment to 3 after successful create',
          );

          await act(async () => {
            root.unmount();
          });
        }

        // Create failure — Evidence tab count unchanged
        {
          setFetch(async (input, init) => {
            const path = String(input);

            if (path === '/api/companies') {
              return createJsonResponse({ data: companiesData });
            }

            if (path === '/api/companies/cmp_1/assessments/asm_1/overview') {
              return createJsonResponse({ data: makeOverview(1) });
            }

            if (path === '/api/threats?assessmentId=asm_1') {
              return createJsonResponse({ data: [] });
            }

            if (path === '/api/evidence?assessmentId=asm_1') {
              return createJsonResponse({ data: [] });
            }

            if (path === '/api/evidence' && init?.method === 'POST') {
              return createJsonResponse(
                {
                  error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Validation error',
                    details: [{ path: 'title', message: 'Title is required.' }],
                  },
                },
                { status: 400 },
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

              '1',

              'Expected initial Evidence tab count 1',
            );
          });

          const addButton = Array.from(
            window.document.querySelectorAll('button'),
          ).find(b => b.textContent?.trim() === 'Add evidence') as
            | HTMLButtonElement
            | undefined;
          assert.ok(addButton, 'Expected the Add evidence button');

          await act(async () => {
            addButton!.dispatchEvent(
              new window.MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                button: 0,
              }),
            );
            await renderTick();
            await renderTick();
          });

          const titleInput = window.document.querySelector(
            '#evidence-title',
          ) as HTMLInputElement | null;
          assert.ok(titleInput, 'Expected evidence title input');

          await act(async () => {
            setTitleInputValue(window, titleInput!, 'New evidence item');
            await renderTick();
          });

          const createButton = Array.from(
            window.document.querySelectorAll('button'),
          ).find(b => b.textContent?.trim() === 'Create evidence') as
            | HTMLButtonElement
            | undefined;
          assert.ok(createButton, 'Expected the Create evidence submit button');

          await act(async () => {
            createButton!.dispatchEvent(
              new window.MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                button: 0,
              }),
            );
            await renderTick();
            await renderTick();
          });

          assert.equal(
            evidenceTabCount(window),
            '1',
            'Expected Evidence tab count to remain 1 after failed create',
          );

          await act(async () => {
            root.unmount();
          });
        }

        console.log('assessmentDetails.evidenceTabCount create tests passed');
      } finally {
        restoreFetch();
      }
    })();
  }, 30_000);
});

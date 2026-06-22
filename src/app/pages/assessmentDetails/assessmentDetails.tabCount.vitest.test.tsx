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

describe('assessmentDetails.tabCount', () => {
  it('passes the migrated checks', async () => {
    const makeThreat = (id: string) => ({
      id,
      assessmentId: 'asm_1',
      title: `Threat ${id}`,
      description: 'A threat description.',
      severity: 'medium',
      strideCategories: ['spoofing'],
      status: 'open',
      owaspCategoryCode: 'A01:2025',
      createdAt: '2026-06-01T09:00:00.000Z',
      updatedAt: '2026-06-10T09:00:00.000Z',
    });

    const makeOverview = (findingsCount: number) => ({
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
        findingsCount,
        evidenceCount: 0,
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

    const findingsTabCount = (window: { document: Document }): string | null =>
      window.document.querySelector('#findings-tab .tabs-tab-count')
        ?.textContent ?? null;

    await (async () => {
      try {
        // Create success — Findings tab count increments
        {
          let threatsCallCount = 0;

          setFetch(async (input, init) => {
            const path = String(input);

            if (path === '/api/companies') {
              return createJsonResponse({ data: companiesData });
            }

            if (path === '/api/companies/cmp_1/assessments/asm_1/overview') {
              return createJsonResponse({ data: makeOverview(2) });
            }

            if (path === '/api/threats?assessmentId=asm_1') {
              threatsCallCount++;
              return createJsonResponse({
                data:
                  threatsCallCount === 1
                    ? [makeThreat('thr_1'), makeThreat('thr_2')]
                    : [
                        makeThreat('thr_1'),
                        makeThreat('thr_2'),
                        makeThreat('thr_3'),
                      ],
              });
            }

            if (path === '/api/threats' && init?.method === 'POST') {
              return createJsonResponse(
                { data: makeThreat('thr_3') },
                { status: 201 },
              );
            }

            throw new Error(
              `Unexpected request: ${path} ${init?.method ?? 'GET'}`,
            );
          });

          const { root, window } = await renderApp(
            routes.assessmentDetailsFindings('cmp_1', 'asm_1'),
          );

          await waitFor(() => {
            assert.equal(
              findingsTabCount(window),

              '2',

              'Expected initial Findings tab count 2',
            );
          });

          const addButton = Array.from(
            window.document.querySelectorAll('button'),
          ).find(b => b.textContent?.trim() === 'Add threat') as
            | HTMLButtonElement
            | undefined;
          assert.ok(addButton, 'Expected the Add threat button');

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
            '#threat-title',
          ) as HTMLInputElement | null;
          assert.ok(titleInput, 'Expected threat title input');

          await act(async () => {
            setTitleInputValue(window, titleInput!, 'New threat');
            await renderTick();
          });

          const createButton = Array.from(
            window.document.querySelectorAll('button'),
          ).find(b => b.textContent?.trim() === 'Create threat') as
            | HTMLButtonElement
            | undefined;
          assert.ok(createButton, 'Expected the Create threat submit button');

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
            findingsTabCount(window),
            '3',
            'Expected Findings tab count to increment to 3 after successful create',
          );

          await act(async () => {
            root.unmount();
          });
        }

        // Create failure — Findings tab count unchanged
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
              return createJsonResponse({ data: [makeThreat('thr_1')] });
            }

            if (path === '/api/threats' && init?.method === 'POST') {
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
            routes.assessmentDetailsFindings('cmp_1', 'asm_1'),
          );

          await waitFor(() => {
            assert.equal(
              findingsTabCount(window),

              '1',

              'Expected initial Findings tab count 1',
            );
          });

          const addButton = Array.from(
            window.document.querySelectorAll('button'),
          ).find(b => b.textContent?.trim() === 'Add threat') as
            | HTMLButtonElement
            | undefined;
          assert.ok(addButton, 'Expected the Add threat button');

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
            '#threat-title',
          ) as HTMLInputElement | null;
          assert.ok(titleInput, 'Expected threat title input');

          await act(async () => {
            setTitleInputValue(window, titleInput!, 'New threat');
            await renderTick();
          });

          const createButton = Array.from(
            window.document.querySelectorAll('button'),
          ).find(b => b.textContent?.trim() === 'Create threat') as
            | HTMLButtonElement
            | undefined;
          assert.ok(createButton, 'Expected the Create threat submit button');

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
            findingsTabCount(window),
            '1',
            'Expected Findings tab count to remain 1 after failed create',
          );

          await act(async () => {
            root.unmount();
          });
        }

        console.log('assessmentDetails.tabCount create tests passed');
      } finally {
        restoreFetch();
      }
    })();
  }, 15_000);
});

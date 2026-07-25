import { describe, it } from 'vitest';

import assert from 'node:assert/strict';

import { act, fireEvent, waitFor } from '~/test/vitestLegacyBridge';

import { routes } from '~/routes';
import {
  CWE_CATALOG_CURRENT_VERSION,
  OWASP_TOP_10_CURRENT_VERSION,
  OWASP_TOP_10_OPTIONS,
  getOwaspTop10CategoryOption,
} from '~/domain';
import {
  createJsonResponse,
  renderApp,
  renderTick,
  restoreFetch,
  setFetch,
  textContent,
} from './assessmentDetails.threatForm.testUtils';

describe('assessmentDetails.threatForm.composition', () => {
  it('passes the migrated checks', async () => {
    const owaspCategoryValue = (code: string) =>
      getOwaspTop10CategoryOption(code)?.value ?? `${code}:2025`;

    await (async () => {
      try {
        {
          let createRequestBody: unknown;

          setFetch(async (input, init) => {
            const path = String(input);

            if (path === '/api/companies') {
              return createJsonResponse({
                data: [
                  {
                    id: 'cmp_1',
                    name: 'Northwind Labs',
                    website: 'https://northwind.example',
                    contactEmail: 'security@northwind.example',
                    assessmentCount: 1,
                    createdAt: '2026-06-01T00:00:00.000Z',
                    updatedAt: '2026-06-10T00:00:00.000Z',
                  },
                ],
              });
            }

            if (path === '/api/companies/cmp_1/assessments/asm_1/overview') {
              return createJsonResponse({
                data: {
                  company: {
                    id: 'cmp_1',
                    name: 'Northwind Labs',
                  },
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
                    cweCatalogVersion: CWE_CATALOG_CURRENT_VERSION,
                    createdAt: '2026-06-01T09:00:00.000Z',
                    updatedAt: '2026-06-11T09:00:00.000Z',
                    recordVersion: 3,
                    findingsCount: 1,
                    evidenceCount: 2,
                    reportVersionCount: 0,
                    testerName: 'Alex Mercer',
                    availableActions: ['complete', 'archive'],
                  },
                },
              });
            }

            if (path === '/api/threats?assessmentId=asm_1') {
              return createJsonResponse({ data: [] });
            }

            if (path === '/api/threats' && createRequestBody === undefined) {
              const body =
                typeof init?.body === 'string' ? init.body : undefined;
              createRequestBody = body ? JSON.parse(body) : undefined;

              return createJsonResponse(
                {
                  error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Unable to save threat',
                    details: [],
                  },
                },
                { status: 500 },
              );
            }

            throw new Error(`Unexpected request: ${path}`);
          });

          const { container, root, window } = await renderApp(
            routes.assessmentDetailsFindings('cmp_1', 'asm_1'),
          );

          await waitFor(() => {
            assert.ok(textContent(container).includes('Add threat'));
          });

          const addThreatButton = Array.from(
            container.querySelectorAll('button'),
          ).find(button => button.textContent?.trim() === 'Add threat') as
            | HTMLButtonElement
            | undefined;

          assert.ok(addThreatButton, 'Expected the create threat action');

          await act(async () => {
            addThreatButton!.dispatchEvent(
              new window.MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                button: 0,
              }),
            );
            await renderTick();
            await renderTick();
          });

          const createSelect = window.document.querySelector(
            '#threat-owasp-category-code',
          ) as HTMLSelectElement | null;

          assert.ok(createSelect, 'Expected the create form OWASP select');
          assert.equal(createSelect?.value, owaspCategoryValue('A01'));
          assert.deepEqual(
            Array.from(createSelect?.options ?? []).map(
              option => option.textContent,
            ),
            [...OWASP_TOP_10_OPTIONS.map(option => option.label), 'Custom'],
          );

          await act(async () => {
            fireEvent.change(createSelect!, {
              target: { value: owaspCategoryValue('A05') },
            });
            await renderTick();
          });

          const cweSearch = window.document.querySelector(
            'input[role="combobox"]',
          ) as HTMLInputElement | null;
          assert.ok(cweSearch, 'Expected the create form CWE search');

          await act(async () => {
            fireEvent.change(cweSearch!, { target: { value: 'CWE-79' } });
            await renderTick();
          });

          const cweOption = window.document.querySelector(
            '[role="option"]',
          ) as HTMLButtonElement | null;
          assert.ok(cweOption, 'Expected a matching CWE option');

          await act(async () => {
            fireEvent.click(cweOption!);
            await renderTick();
          });

          const titleInput = window.document.querySelector(
            '#threat-title',
          ) as HTMLInputElement | null;

          assert.ok(titleInput, 'Expected the create form title input');

          await act(async () => {
            fireEvent.change(titleInput!, {
              target: { value: 'SQL injection' },
            });
            await renderTick();
          });

          assert.equal(titleInput.value, 'SQL injection');

          const createButton = Array.from(
            window.document.querySelectorAll('button'),
          ).find(button => button.textContent?.trim() === 'Create threat') as
            | HTMLButtonElement
            | undefined;

          assert.ok(createButton, 'Expected the create threat submit action');

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
            (createRequestBody as { owaspCategoryCode?: string } | undefined)
              ?.owaspCategoryCode,
            owaspCategoryValue('A05'),
          );
          assert.deepEqual(
            (createRequestBody as { cweIds?: string[] } | undefined)?.cweIds,
            ['CWE-79'],
          );
          assert.equal(createSelect?.value, owaspCategoryValue('A05'));
          assert.ok(
            textContent(window.document.body).includes('CWE-79'),
            'Expected the failed submit to preserve CWE selection',
          );
          assert.ok(
            textContent(window.document.body).includes('Unable to save threat'),
          );

          await act(async () => {
            root.unmount();
          });
        }

        {
          setFetch(async input => {
            const path = String(input);

            if (path === '/api/companies') {
              return createJsonResponse({
                data: [
                  {
                    id: 'cmp_1',
                    name: 'Northwind Labs',
                    website: 'https://northwind.example',
                    contactEmail: 'security@northwind.example',
                    assessmentCount: 1,
                    createdAt: '2026-06-01T00:00:00.000Z',
                    updatedAt: '2026-06-10T00:00:00.000Z',
                  },
                ],
              });
            }

            if (path === '/api/companies/cmp_1/assessments/asm_1/overview') {
              return createJsonResponse({
                data: {
                  company: {
                    id: 'cmp_1',
                    name: 'Northwind Labs',
                  },
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
                    cweCatalogVersion: CWE_CATALOG_CURRENT_VERSION,
                    createdAt: '2026-06-01T09:00:00.000Z',
                    updatedAt: '2026-06-11T09:00:00.000Z',
                    recordVersion: 3,
                    findingsCount: 1,
                    evidenceCount: 2,
                    reportVersionCount: 0,
                    testerName: 'Alex Mercer',
                    availableActions: ['complete', 'archive'],
                  },
                },
              });
            }

            if (path === '/api/threats?assessmentId=asm_1') {
              return createJsonResponse({
                data: [
                  {
                    id: 'thr_1',
                    assessmentId: 'asm_1',
                    title: 'Legacy authorization weakness',
                    description:
                      'Historical issue stored with an old category code.',
                    severity: 'high',
                    strideCategories: ['spoofing'],
                    status: 'open',
                    cweCatalogVersion: CWE_CATALOG_CURRENT_VERSION,
                    cweMappings: [
                      {
                        id: 'CWE-71',
                        name: "DEPRECATED: Apple '.DS_Store'",
                        status: 'Deprecated',
                        deprecated: true,
                        primary: true,
                        replacementIds: ['CWE-200'],
                      },
                      {
                        id: 'CWE-79',
                        name: 'Improper Neutralization of Input During Web Page Generation',
                        status: 'Stable',
                        deprecated: false,
                        primary: false,
                        replacementIds: [],
                      },
                    ],
                    assessmentOwaspTaxonomyVersion:
                      OWASP_TOP_10_CURRENT_VERSION,
                    owaspCategoryCode: 'A01:2023',
                    affectedComponent: 'Orders API',
                    affectedEndpoint: '/api/orders/{id}',
                    risk: 'A customer can access another customer order.',
                    recommendation: 'Apply object-level authorization.',
                    observation:
                      'An authenticated user can request another order.',
                    references: 'OWASP API1:2023',
                    createdAt: '2026-06-01T09:00:00.000Z',
                    updatedAt: '2026-06-11T09:00:00.000Z',
                  },
                ],
              });
            }

            throw new Error(`Unexpected request: ${path}`);
          });

          const { container, root, window } = await renderApp(
            routes.assessmentDetailsFindings('cmp_1', 'asm_1'),
          );

          const editThreatButton = Array.from(
            container.querySelectorAll('button'),
          ).find(button => button.textContent?.trim() === 'Edit threat') as
            | HTMLButtonElement
            | undefined;

          assert.ok(editThreatButton, 'Expected the edit threat action');

          await act(async () => {
            editThreatButton!.dispatchEvent(
              new window.MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                button: 0,
              }),
            );
            await renderTick();
            await renderTick();
          });

          const editSelect = window.document.querySelector(
            '#threat-owasp-category-code',
          ) as HTMLSelectElement | null;

          assert.ok(editSelect, 'Expected the edit form OWASP select');
          assert.equal(editSelect?.value, 'A01:2023');
          assert.ok(
            Array.from(editSelect?.options ?? []).some(
              option => option.value === 'A01:2023',
            ),
            'Expected the historical value to remain selectable',
          );
          const editBodyText = textContent(window.document.body);
          assert.ok(
            editBodyText.includes("CWE-71 - DEPRECATED: Apple '.DS_Store'"),
            'Expected the deprecated Primary CWE to preload',
          );
          assert.ok(
            editBodyText.includes(
              'CWE-79 - Improper Neutralization of Input During Web Page Generation',
            ),
            'Expected the Additional CWE to preload in order',
          );

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

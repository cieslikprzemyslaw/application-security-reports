import assert from 'node:assert/strict';

import { act } from 'react';

import { routes } from '~/routes';
import {
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
          const body = typeof init?.body === 'string' ? init.body : undefined;
          createRequestBody = body ? JSON.parse(body) : undefined;

          return createJsonResponse(
            {
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Unable to save threat',
                details: [],
              },
            },
            { status: 400 },
          );
        }

        throw new Error(`Unexpected request: ${path}`);
      });

      const { container, root, window } = await renderApp(
        routes.assessmentDetailsFindings('cmp_1', 'asm_1'),
      );

      assert.ok(textContent(container).includes('Add threat'));

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
        createSelect!.value = owaspCategoryValue('A05');
        createSelect!.dispatchEvent(
          new window.Event('change', { bubbles: true, cancelable: true }),
        );
        await renderTick();
      });

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
      assert.equal(createSelect?.value, owaspCategoryValue('A05'));
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
                owaspCategoryCode: 'A01:2023',
                affectedComponent: 'Orders API',
                affectedEndpoint: '/api/orders/{id}',
                risk: 'A customer can access another customer order.',
                recommendation: 'Apply object-level authorization.',
                observation: 'An authenticated user can request another order.',
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

      await act(async () => {
        root.unmount();
      });
    }
  } finally {
    restoreFetch();
  }
})();
